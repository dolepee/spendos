'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Plus, Shield, Activity, AlertTriangle, 
  CheckCircle, XCircle, Clock, Key, Settings,
  DollarSign, RefreshCw, MoreVertical, Eye, EyeOff,
  Bot, Zap, ChevronRight, TrendingUp, TrendingDown
} from 'lucide-react';
import { Agent, Transaction } from '@/lib/types';

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Content Writer Agent',
    apiKey: 'sk_live_abc123xyz',
    apiKeyPrefix: 'sk_live_',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE21',
    dailyLimit: 50,
    monthlyLimit: 500,
    chains: 'ethereum,polygon',
    status: 'active',
    totalSpent: 127.50,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Image Generator Agent',
    apiKey: 'sk_live_def456uvw',
    apiKeyPrefix: 'sk_live_',
    wallet: '0x8Ba1f109551bD432803012645Hac136E65fE1D24',
    dailyLimit: 100,
    monthlyLimit: 2000,
    chains: 'ethereum,solana',
    status: 'active',
    totalSpent: 892.00,
    createdAt: '2026-04-02T14:30:00Z',
  },
  {
    id: '3',
    name: 'Research Agent',
    apiKey: 'sk_live_ghi789rst',
    apiKeyPrefix: 'sk_live_',
    wallet: '0x5B38Da6a701c568545dCfcB03FcB875f56bed6C5',
    dailyLimit: 25,
    monthlyLimit: 250,
    chains: 'ethereum',
    status: 'paused',
    totalSpent: 45.00,
    createdAt: '2026-04-03T09:15:00Z',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    agentId: '1',
    hash: '0x8a9b2c1d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5',
    chain: 'ethereum',
    amount: 5.50,
    currency: 'USDC',
    toAddress: '0x742d...8fE21',
    status: 'confirmed',
    createdAt: '2026-04-04T15:30:00Z',
  },
  {
    id: '2',
    agentId: '2',
    hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7',
    chain: 'polygon',
    amount: 25.00,
    currency: 'USDC',
    toAddress: '0x3BcD...2XyZ',
    status: 'pending',
    createdAt: '2026-04-04T16:45:00Z',
  },
  {
    id: '3',
    agentId: '1',
    hash: '0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3',
    chain: 'ethereum',
    amount: 2.25,
    currency: 'USDC',
    toAddress: '0x4Ef2...9AbC',
    status: 'confirmed',
    createdAt: '2026-04-04T14:20:00Z',
  },
  {
    id: '4',
    agentId: '2',
    hash: '0xabcd1234efgh5678ij90kl12mn3456op7890qr12st3456uv7890wx12',
    chain: 'solana',
    amount: 150.00,
    currency: 'USDC',
    toAddress: '7Ec...hJk',
    status: 'confirmed',
    createdAt: '2026-04-04T12:00:00Z',
  },
];

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    dailyLimit: 50,
    monthlyLimit: 500,
    chains: 'ethereum',
  });

  const totalSpent = agents.reduce((sum, a) => sum + a.totalSpent, 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const pendingTx = transactions.filter(t => t.status === 'pending').length;

  const createAgent = () => {
    const apiKey = `sk_live_${Math.random().toString(36).substring(2, 15)}`;
    const agent: Agent = {
      id: Math.random().toString(36).substring(7),
      name: newAgent.name,
      apiKey,
      apiKeyPrefix: 'sk_live_',
      wallet: `0x${Math.random().toString(16).substring(2, 42)}`,
      dailyLimit: newAgent.dailyLimit,
      monthlyLimit: newAgent.monthlyLimit,
      chains: newAgent.chains,
      status: 'active',
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setAgents([...agents, agent]);
    setShowCreateModal(false);
    setNewAgent({ name: '', dailyLimit: 50, monthlyLimit: 500, chains: 'ethereum' });
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'active' ? 'paused' : 'active' };
      }
      return a;
    }));
  };

  const revokeAgent = (id: string) => {
    setAgents(agents.map(a => {
      if (a.id === id) {
        return { ...a, status: 'revoked' };
      }
      return a;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-blue-950/20 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SpendOS</h1>
                <p className="text-xs text-zinc-500">Agent Wallet Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 text-sm">Total Spent</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">Across all agents</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 text-sm">Active Agents</span>
              <Bot className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-3xl font-bold text-white">{activeAgents}</p>
            <p className="text-xs text-zinc-500 mt-1">of {agents.length} total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 text-sm">Pending Txns</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-white">{pendingTx}</p>
            <p className="text-xs text-zinc-500 mt-1">Awaiting confirmation</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-500 text-sm">Security</span>
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-500">Secure</p>
            <p className="text-xs text-zinc-500 mt-1">Policy engine active</p>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents List */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-violet-500" />
                  Agent Wallets
                </h2>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {agents.map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                      selectedAgent?.id === agent.id ? 'bg-violet-500/10' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          agent.status === 'active' ? 'bg-emerald-500/20' :
                          agent.status === 'paused' ? 'bg-amber-500/20' : 'bg-red-500/20'
                        }`}>
                          <Bot className={`w-5 h-5 ${
                            agent.status === 'active' ? 'text-emerald-500' :
                            agent.status === 'paused' ? 'text-amber-500' : 'text-red-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{agent.name}</h3>
                          <p className="text-xs text-zinc-500 font-mono">
                            {agent.wallet.slice(0, 10)}...{agent.wallet.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        agent.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Daily Limit</p>
                        <p className="text-sm font-medium text-white">${agent.dailyLimit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Spent Today</p>
                        <p className="text-sm font-medium text-white">${agent.totalSpent.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Chains</p>
                        <p className="text-sm font-medium text-white capitalize">{agent.chains.split(',').length}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2">
                        {agent.status !== 'revoked' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleAgentStatus(agent.id); }}
                              className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                            >
                              {agent.status === 'active' ? 'Pause' : 'Resume'}
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); revokeAgent(agent.id); }}
                              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Feed */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden sticky top-24">
              <div className="p-5 border-b border-zinc-800/50">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Recent Activity
                </h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {tx.status === 'confirmed' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : tx.status === 'pending' ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-white">
                          ${tx.amount.toFixed(2)} {tx.currency}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.chain === 'ethereum' ? 'bg-blue-500/20 text-blue-400' :
                        tx.chain === 'polygon' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {tx.chain}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mb-1">
                      To: {tx.toAddress}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Agent Detail */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedAgent.name}</h3>
                    <p className="text-sm text-zinc-500">Agent Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-zinc-800/50 px-4 py-3 rounded-lg text-sm font-mono text-emerald-400">
                      {showApiKey === selectedAgent.id ? selectedAgent.apiKey : '•'.repeat(20)}
                    </code>
                    <button
                      onClick={() => setShowApiKey(showApiKey === selectedAgent.id ? null : selectedAgent.id)}
                      className="p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors"
                    >
                      {showApiKey === selectedAgent.id ? (
                        <EyeOff className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Save this key securely. It won&apos;t be shown again.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Wallet Address</label>
                  <code className="block bg-zinc-800/50 px-4 py-3 rounded-lg text-sm font-mono text-zinc-300">
                    {selectedAgent.wallet}
                  </code>
                </div>

                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Daily Limit</label>
                  <div className="bg-zinc-800/50 px-4 py-3 rounded-lg">
                    <p className="text-2xl font-bold text-white">${selectedAgent.dailyLimit}</p>
                    <div className="mt-2 h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                        style={{ width: `${(selectedAgent.totalSpent / selectedAgent.dailyLimit) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      ${selectedAgent.totalSpent.toFixed(2)} used of ${selectedAgent.dailyLimit}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Allowed Chains</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.chains.split(',').map(chain => (
                      <span key={chain} className="px-3 py-1.5 bg-zinc-800/50 rounded-lg text-sm text-zinc-300 capitalize">
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-white mb-6">Create New Agent</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Agent Name</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Image Generator Agent"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-500 mb-2 block">Daily Limit ($)</label>
                    <input
                      type="number"
                      value={newAgent.dailyLimit}
                      onChange={(e) => setNewAgent({ ...newAgent, dailyLimit: Number(e.target.value) })}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-500 mb-2 block">Monthly Limit ($)</label>
                    <input
                      type="number"
                      value={newAgent.monthlyLimit}
                      onChange={(e) => setNewAgent({ ...newAgent, monthlyLimit: Number(e.target.value) })}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-zinc-500 mb-2 block">Allowed Chains</label>
                  <select
                    value={newAgent.chains}
                    onChange={(e) => setNewAgent({ ...newAgent, chains: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="ethereum,polygon">Ethereum + Polygon</option>
                    <option value="ethereum,solana">Ethereum + Solana</option>
                    <option value="ethereum,polygon,solana">All Chains</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createAgent}
                  disabled={!newAgent.name}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                >
                  Create Agent
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
