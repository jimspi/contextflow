'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Zap, Calendar, MessageSquare, TrendingUp, Clock, Plus, X, Send, Edit2, Trash2, Download, Upload, Search, LogOut } from 'lucide-react';
import { supabase, getUser, signOut, fetchContexts, createContext, updateContext, deleteContext, searchContexts, fetchInsights, createInsight } from './lib/supabase';
import Auth from './components/Auth';

const ContextFlow = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeView, setActiveView] = useState('dashboard');
  const [showAddContext, setShowAddContext] = useState(false);
  const [editingContext, setEditingContext] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data state
  const [contexts, setContexts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Form state
  const [newContext, setNewContext] = useState({
    title: '',
    summary: '',
    type: 'custom',
    priority: 'medium',
    connections: []
  });
  const [chatInput, setChatInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContexts, setFilteredContexts] = useState([]);

  // Check authentication on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadContexts();
      loadInsights();
    }
  }, [user]);

  // Update filtered contexts when search term or contexts change
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = contexts.filter(context =>
        context.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        context.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContexts(filtered);
    } else {
      setFilteredContexts(contexts);
    }
  }, [searchTerm, contexts]);

  const checkUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContexts = async () => {
    if (!user) return;

    try {
      const { data, error } = await fetchContexts(user.id);
      if (error) throw error;
      setContexts(data || []);
    } catch (error) {
      console.error('Error loading contexts:', error);
    }
  };

  const loadInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await fetchInsights(user.id);
      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setContexts([]);
    setInsights([]);
    setChatMessages([]);
  };

  const generateInsight = async (context) => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userContexts: contexts })
      });

      const data = await response.json();

      // Save insight to database
      const { data: savedInsight, error } = await createInsight(user.id, data.insight);
      if (!error && savedInsight) {
        setInsights([savedInsight, ...insights]);
      }
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddContext = async () => {
    if (!user || !newContext.title.trim()) return;

    try {
      const { data, error } = await createContext(user.id, newContext);
      if (error) throw error;

      if (data) {
        setContexts([data, ...contexts]);
        setNewContext({
          title: '',
          summary: '',
          type: 'custom',
          priority: 'medium',
          connections: []
        });
        setShowAddContext(false);
        generateInsight(data);
      }
    } catch (error) {
      console.error('Error adding context:', error);
    }
  };

  const handleEditContext = (context) => {
    setEditingContext(context);
    setNewContext({
      title: context.title,
      summary: context.summary,
      type: context.type,
      priority: context.priority,
      connections: context.connections || []
    });
  };

  const handleUpdateContext = async () => {
    if (!editingContext || !newContext.title.trim()) return;

    try {
      const { data, error } = await updateContext(editingContext.id, {
        title: newContext.title,
        summary: newContext.summary,
        type: newContext.type,
        priority: newContext.priority,
        connections: newContext.connections
      });

      if (error) throw error;

      if (data) {
        setContexts(contexts.map(c => c.id === data.id ? data : c));
        setEditingContext(null);
        setNewContext({
          title: '',
          summary: '',
          type: 'custom',
          priority: 'medium',
          connections: []
        });
      }
    } catch (error) {
      console.error('Error updating context:', error);
    }
  };

  const handleDeleteContext = async (contextId) => {
    if (!confirm('Are you sure you want to delete this context?')) return;

    try {
      const { error } = await deleteContext(contextId);
      if (error) throw error;

      setContexts(contexts.filter(c => c.id !== contextId));
    } catch (error) {
      console.error('Error deleting context:', error);
    }
  };

  const handleExportData = () => {
    const exportData = {
      contexts,
      insights,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contextflow-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (importedData.contexts && Array.isArray(importedData.contexts)) {
          // Import contexts to database
          for (const context of importedData.contexts) {
            await createContext(user.id, {
              title: context.title,
              summary: context.summary,
              type: context.type,
              priority: context.priority,
              connections: context.connections || []
            });
          }

          // Reload contexts
          await loadContexts();
          alert('Data imported successfully!');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user) return;

    const userMessage = { role: 'user', content: chatInput, timestamp: new Date() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');

    try {
      // Call OpenAI API with user's context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userContexts: contexts
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message to user
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. ${
          error.message.includes('API') || error.message.includes('key')
            ? 'Please make sure the OPENAI_API_KEY environment variable is set in your Vercel project settings.'
            : ''
        }`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const StatCard = ({ icon: Icon, label, value, trend }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </p>
          )}
        </div>
        <div className="bg-zinc-800 p-3 rounded-lg">
          <Icon size={20} className="text-zinc-400" />
        </div>
      </div>
    </div>
  );

  const InsightCard = ({ insight }) => {
    const typeColors = {
      opportunity: 'border-l-blue-500 bg-blue-500/5',
      reminder: 'border-l-amber-500 bg-amber-500/5',
      conflict: 'border-l-red-500 bg-red-500/5',
      analysis: 'border-l-emerald-500 bg-emerald-500/5'
    };

    return (
      <div className={`bg-zinc-900 border border-zinc-800 border-l-2 ${typeColors[insight.type]} rounded-lg p-4 hover:border-zinc-700 transition-all`}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-white font-medium">{insight.title}</h4>
          <span className="text-xs text-zinc-500">{insight.timestamp}</span>
        </div>
        <p className="text-zinc-400 text-sm mb-3">{insight.message}</p>
        {insight.actionable && (
          <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Take Action →
          </button>
        )}
      </div>
    );
  };

  const ContextCard = ({ context, onEdit, onDelete }) => {
    const priorityColors = {
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    };

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-white font-medium">{context.title}</h4>
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[context.priority]}`}>
                {context.priority}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">{context.summary}</p>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(context)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Edit context"
            >
              <Edit2 size={16} className="text-zinc-400 hover:text-white" />
            </button>
            <button
              onClick={() => onDelete(context.id)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Delete context"
            >
              <Trash2 size={16} className="text-zinc-400 hover:text-red-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {context.connections && context.connections.map((conn, idx) => (
              <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                {conn}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-500 whitespace-nowrap ml-3">
            {formatDate(context.last_updated)}
          </span>
        </div>
      </div>
    );
  };

  // Show auth screen if not logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Brain size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">ContextFlow</h1>
                <p className="text-xs text-zinc-500">Personal AI Memory Layer</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('contexts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'contexts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Contexts
              </button>
              <button
                onClick={() => setActiveView('chat')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <div className="w-px h-6 bg-zinc-800 mx-2" />
              <button
                onClick={handleExportData}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Export data"
              >
                <Download size={18} />
              </button>
              <label className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" title="Import data">
                <Upload size={18} />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleSignOut}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'dashboard' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Brain} label="Active Contexts" value={contexts.length} />
              <StatCard icon={Zap} label="Insights Generated" value={insights.length} />
              <StatCard icon={Calendar} label="Connections Made" value={contexts.reduce((acc, ctx) => acc + (ctx.connections?.length || 0), 0)} />
              <StatCard icon={Clock} label="Chat Messages" value={chatMessages.length} />
            </div>

            {/* Recent Insights */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Insights</h2>
                <button
                  onClick={() => generateInsight({ title: 'General', description: 'System analysis' })}
                  disabled={isGenerating || contexts.length === 0}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <Zap size={14} />
                  {isGenerating ? 'Generating...' : 'Generate New'}
                </button>
              </div>
              {insights.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No insights yet. {contexts.length === 0 ? 'Add some contexts first!' : 'Click "Generate New" to create one.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </div>

            {/* Priority Contexts */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Priority Contexts</h2>
              <div className="space-y-3">
                {contexts.filter(c => c.priority === 'high').map(context => (
                  <ContextCard
                    key={context.id}
                    context={context}
                    onEdit={handleEditContext}
                    onDelete={handleDeleteContext}
                  />
                ))}
                {contexts.filter(c => c.priority === 'high').length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No high priority contexts yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'contexts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Context Library</h2>
              <button
                onClick={() => {
                  setShowAddContext(true);
                  setEditingContext(null);
                  setNewContext({
                    title: '',
                    summary: '',
                    type: 'custom',
                    priority: 'medium',
                    connections: []
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Add Context
              </button>
            </div>

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Search contexts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {(showAddContext || editingContext) && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingContext ? 'Edit Context' : 'New Context'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddContext(false);
                      setEditingContext(null);
                      setNewContext({
                        title: '',
                        summary: '',
                        type: 'custom',
                        priority: 'medium',
                        connections: []
                      });
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Context title..."
                    value={newContext.title}
                    onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />

                  <textarea
                    placeholder="Add details about this context..."
                    value={newContext.summary}
                    onChange={(e) => setNewContext({ ...newContext, summary: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Type</label>
                      <select
                        value={newContext.type}
                        onChange={(e) => setNewContext({ ...newContext, type: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="custom">Custom</option>
                        <option value="project">Project</option>
                        <option value="personal">Personal</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Priority</label>
                      <select
                        value={newContext.priority}
                        onChange={(e) => setNewContext({ ...newContext, priority: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={editingContext ? handleUpdateContext : handleAddContext}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {editingContext ? 'Update Context' : 'Add Context'}
                </button>
              </div>
            )}

            {filteredContexts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                {searchTerm ? 'No contexts found matching your search.' : 'No contexts yet. Add one to get started!'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContexts.map(context => (
                  <ContextCard
                    key={context.id}
                    context={context}
                    onEdit={handleEditContext}
                    onDelete={handleDeleteContext}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'chat' && (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Context-Aware Chat</h2>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-6 overflow-y-auto mb-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Ask me anything about your contexts, goals, or insights</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-100'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Message ContextFlow..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContextFlow;