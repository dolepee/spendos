use std::path::Path;

use ows_signer::{decrypt, CryptoEnvelope};

use crate::error::GuardianError;
use crate::guardian_store;
use crate::recovery_store;
use crate::shamir;
use crate::types::{Guardian, GuardianUnlock, RecoveryRequest, RecoveryStatus, SubmittedShard};

fn verify_guardian<'a>(
    guardians: &'a [Guardian],
    guardian_id: &str,
    guardian_passphrase: &str,
) -> Result<&'a Guardian, GuardianError> {
    let guardian = guardians
        .iter()
        .find(|g| g.id == guardian_id)
        .ok_or_else(|| GuardianError::GuardianNotFound(guardian_id.to_string()))?;

    let envelope: CryptoEnvelope = serde_json::from_value(guardian.encrypted_shard.clone())
        .map_err(GuardianError::Json)?;
    let _ = decrypt(&envelope, guardian_passphrase)?;

    Ok(guardian)
}

pub fn initiate_recovery(
    wallet_id: &str,
    guardian_id: &str,
    guardian_passphrase: &str,
    time_lock_hours: u64,
    vault_path: Option<&Path>,
) -> Result<RecoveryRequest, GuardianError> {
    let config = guardian_store::load_guardian_config(wallet_id, vault_path)?;

    verify_guardian(&config.guardians, guardian_id, guardian_passphrase)?;

    if let Ok(existing) = recovery_store::load_recovery(wallet_id, vault_path) {
        if existing.status == RecoveryStatus::Pending
            || existing.status == RecoveryStatus::ThresholdMet
        {
            return Err(GuardianError::RecoveryAlreadyActive(wallet_id.to_string()));
        }
    }

    let now = chrono::Utc::now();
    let time_lock_until = now + chrono::Duration::hours(time_lock_hours as i64);

    let request = RecoveryRequest {
        wallet_id: wallet_id.to_string(),
        initiated_by: guardian_id.to_string(),
        initiated_at: now.to_rfc3339(),
        time_lock_until: time_lock_until.to_rfc3339(),
        status: RecoveryStatus::Pending,
        submitted_shards: Vec::new(),
        threshold: config.threshold,
    };

    recovery_store::save_recovery(&request, vault_path)?;
    Ok(request)
}

pub fn submit_shard(
    wallet_id: &str,
    guardian_id: &str,
    guardian_passphrase: &str,
    vault_path: Option<&Path>,
) -> Result<RecoveryRequest, GuardianError> {
    let config = guardian_store::load_guardian_config(wallet_id, vault_path)?;
    let mut request = recovery_store::load_recovery(wallet_id, vault_path)?;

    if request.status == RecoveryStatus::Frozen {
        return Err(GuardianError::RecoveryFrozen(wallet_id.to_string()));
    }
    if request.status != RecoveryStatus::Pending && request.status != RecoveryStatus::ThresholdMet {
        return Err(GuardianError::RecoveryNotFound(wallet_id.to_string()));
    }

    if request
        .submitted_shards
        .iter()
        .any(|s| s.guardian_id == guardian_id)
    {
        return Err(GuardianError::DuplicateShard(guardian_id.to_string()));
    }

    verify_guardian(&config.guardians, guardian_id, guardian_passphrase)?;

    request.submitted_shards.push(SubmittedShard {
        guardian_id: guardian_id.to_string(),
        submitted_at: chrono::Utc::now().to_rfc3339(),
    });

    if request.submitted_shards.len() >= request.threshold as usize {
        request.status = RecoveryStatus::ThresholdMet;
    }

    recovery_store::save_recovery(&request, vault_path)?;
    Ok(request)
}

pub fn complete_recovery(
    wallet_id: &str,
    guardian_unlocks: &[GuardianUnlock],
    vault_path: Option<&Path>,
) -> Result<Vec<u8>, GuardianError> {
    let config = guardian_store::load_guardian_config(wallet_id, vault_path)?;
    let request = recovery_store::load_recovery(wallet_id, vault_path)?;

    if request.status != RecoveryStatus::ThresholdMet {
        return Err(GuardianError::ThresholdNotMet {
            have: request.submitted_shards.len(),
            need: request.threshold as usize,
        });
    }

    let now = chrono::Utc::now();
    let time_lock = chrono::DateTime::parse_from_rfc3339(&request.time_lock_until)
        .map_err(|e| GuardianError::RecoveryNotFound(e.to_string()))?;
    if now < time_lock {
        return Err(GuardianError::TimeLocked(request.time_lock_until.clone()));
    }

    let mut shard_bytes = Vec::new();
    for unlock in guardian_unlocks {
        if !request
            .submitted_shards
            .iter()
            .any(|s| s.guardian_id == unlock.guardian_id)
        {
            continue;
        }

        if shard_bytes.len() >= config.threshold as usize {
            break;
        }

        let guardian = verify_guardian(&config.guardians, &unlock.guardian_id, &unlock.passphrase)?;
        let envelope: CryptoEnvelope = serde_json::from_value(guardian.encrypted_shard.clone())
            .map_err(GuardianError::Json)?;
        let shard = decrypt(&envelope, &unlock.passphrase)?;
        shard_bytes.push(shard.expose().to_vec());
    }

    if shard_bytes.len() < config.threshold as usize {
        return Err(GuardianError::ThresholdNotMet {
            have: shard_bytes.len(),
            need: config.threshold as usize,
        });
    }

    let secret = shamir::reconstruct_secret(&shard_bytes, config.threshold)?;

    let recovered_hash = shamir::hash_secret(&secret);
    if recovered_hash != config.secret_hash {
        return Err(GuardianError::SecretHashMismatch);
    }

    let mut request = request;
    request.status = RecoveryStatus::Completed;
    recovery_store::save_recovery(&request, vault_path)?;

    Ok(secret)
}

pub fn cancel_recovery(
    wallet_id: &str,
    guardian_id: &str,
    guardian_passphrase: &str,
    vault_path: Option<&Path>,
) -> Result<(), GuardianError> {
    let config = guardian_store::load_guardian_config(wallet_id, vault_path)?;
    let mut request = recovery_store::load_recovery(wallet_id, vault_path)?;

    let guardian = verify_guardian(&config.guardians, guardian_id, guardian_passphrase)?;
    let can_cancel = request.initiated_by == guardian_id || guardian.can_freeze;
    if !can_cancel {
        return Err(GuardianError::UnauthorizedAction(format!(
            "{} cannot cancel recovery for {}",
            guardian_id, wallet_id
        )));
    }

    request.status = RecoveryStatus::Cancelled;
    recovery_store::save_recovery(&request, vault_path)?;
    Ok(())
}

pub fn freeze_recovery(
    wallet_id: &str,
    guardian_id: &str,
    guardian_passphrase: &str,
    vault_path: Option<&Path>,
) -> Result<(), GuardianError> {
    let config = guardian_store::load_guardian_config(wallet_id, vault_path)?;

    let guardian = verify_guardian(&config.guardians, guardian_id, guardian_passphrase)?;
    if !guardian.can_freeze {
        return Err(GuardianError::UnauthorizedAction(format!(
            "{} is not authorized to freeze recovery",
            guardian_id
        )));
    }

    let mut request = recovery_store::load_recovery(wallet_id, vault_path)?;
    if request.status != RecoveryStatus::Pending && request.status != RecoveryStatus::ThresholdMet {
        return Err(GuardianError::RecoveryNotFound(wallet_id.to_string()));
    }

    request.status = RecoveryStatus::Frozen;
    recovery_store::save_recovery(&request, vault_path)?;

    Ok(())
}

pub fn recovery_status(
    wallet_id: &str,
    vault_path: Option<&Path>,
) -> Result<RecoveryRequest, GuardianError> {
    recovery_store::load_recovery(wallet_id, vault_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    use tempfile::tempdir;

    use crate::setup::setup_guardians;
    use crate::types::GuardianInput;
    use ows_signer::encrypt;

    fn setup_fixture() -> (tempfile::TempDir, String, serde_json::Value) {
        let temp = tempdir().unwrap();
        let owner_passphrase = "owner-passphrase".to_string();
        let secret = b"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let wallet_crypto = serde_json::to_value(encrypt(secret, &owner_passphrase).unwrap()).unwrap();

        let guardians = vec![
            GuardianInput {
                name: "Guardian One".into(),
                passphrase: "guardian-one-pass".into(),
                can_freeze: false,
            },
            GuardianInput {
                name: "Guardian Two".into(),
                passphrase: "guardian-two-pass".into(),
                can_freeze: false,
            },
            GuardianInput {
                name: "Guardian Three".into(),
                passphrase: "guardian-three-pass".into(),
                can_freeze: true,
            },
        ];

        setup_guardians(
            "wallet-1",
            "Primary Wallet",
            &wallet_crypto,
            &owner_passphrase,
            2,
            &guardians,
            24,
            Some(temp.path()),
        )
        .unwrap();

        (temp, owner_passphrase, wallet_crypto)
    }

    #[test]
    fn initiate_recovery_requires_guardian_proof() {
        let (temp, _, _) = setup_fixture();

        let err = initiate_recovery(
            "wallet-1",
            "guardian-1",
            "wrong-passphrase",
            24,
            Some(temp.path()),
        )
        .unwrap_err();

        assert!(matches!(err, GuardianError::Crypto(_)));
    }

    #[test]
    fn cancel_recovery_requires_authorized_guardian() {
        let (temp, _, _) = setup_fixture();

        initiate_recovery(
            "wallet-1",
            "guardian-1",
            "guardian-one-pass",
            24,
            Some(temp.path()),
        )
        .unwrap();

        let err = cancel_recovery(
            "wallet-1",
            "guardian-2",
            "guardian-two-pass",
            Some(temp.path()),
        )
        .unwrap_err();

        assert!(matches!(err, GuardianError::UnauthorizedAction(_)));

        cancel_recovery(
            "wallet-1",
            "guardian-3",
            "guardian-three-pass",
            Some(temp.path()),
        )
        .unwrap();
    }

    #[test]
    fn recovery_store_does_not_persist_plaintext_shards() {
        let (temp, _, _) = setup_fixture();

        initiate_recovery(
            "wallet-1",
            "guardian-1",
            "guardian-one-pass",
            24,
            Some(temp.path()),
        )
        .unwrap();
        submit_shard("wallet-1", "guardian-1", "guardian-one-pass", Some(temp.path())).unwrap();
        submit_shard("wallet-1", "guardian-2", "guardian-two-pass", Some(temp.path())).unwrap();

        let persisted = std::fs::read_to_string(temp.path().join("recovery").join("wallet-1.json")).unwrap();
        assert!(!persisted.contains("shard_data"));
        assert!(!persisted.contains("guardian-one-pass"));
        assert!(!persisted.contains("guardian-two-pass"));
    }

    #[test]
    fn complete_recovery_requires_time_lock_and_unlocks() {
        let (temp, _, _) = setup_fixture();

        initiate_recovery(
            "wallet-1",
            "guardian-1",
            "guardian-one-pass",
            24,
            Some(temp.path()),
        )
        .unwrap();
        submit_shard("wallet-1", "guardian-1", "guardian-one-pass", Some(temp.path())).unwrap();
        submit_shard("wallet-1", "guardian-2", "guardian-two-pass", Some(temp.path())).unwrap();

        let err = complete_recovery(
            "wallet-1",
            &[
                GuardianUnlock {
                    guardian_id: "guardian-1".into(),
                    passphrase: "guardian-one-pass".into(),
                },
                GuardianUnlock {
                    guardian_id: "guardian-2".into(),
                    passphrase: "guardian-two-pass".into(),
                },
            ],
            Some(temp.path()),
        )
        .unwrap_err();
        assert!(matches!(err, GuardianError::TimeLocked(_)));

        let mut request = recovery_store::load_recovery("wallet-1", Some(temp.path())).unwrap();
        request.time_lock_until = (chrono::Utc::now() - chrono::Duration::hours(1)).to_rfc3339();
        recovery_store::save_recovery(&request, Some(temp.path())).unwrap();

        let recovered = complete_recovery(
            "wallet-1",
            &[
                GuardianUnlock {
                    guardian_id: "guardian-1".into(),
                    passphrase: "guardian-one-pass".into(),
                },
                GuardianUnlock {
                    guardian_id: "guardian-2".into(),
                    passphrase: "guardian-two-pass".into(),
                },
            ],
            Some(temp.path()),
        )
        .unwrap();

        assert_eq!(
            recovered,
            b"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
        );
    }
}
