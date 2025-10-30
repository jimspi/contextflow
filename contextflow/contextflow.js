import React, { useState, useEffect } from 'react';
import { Brain, Zap, Calendar, MessageSquare, TrendingUp, Clock, Plus, X, Send, Upload, Trash2 } from 'lucide-react';

const ContextFlow = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [contexts, setContexts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({ title: '', description: '', type: 'custom', priority: 'medium' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Generate AI insight using OpenAI API
  const generateInsight = async (context) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, userContexts: contexts })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      const newInsight = {
        id: Date.now(),
        ...data.insight,
        timestamp: 'Just now'
      };
      setInsights([newInsight, ...insights]);
    } catch (error) {
      console.error('Error generating insight:', error);
      alert('Failed to generate insight. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddContext = () => {
    if (newContext.title.trim()) {
      const context = {
        id: Date.now(),
        type: newContext.type || 'custom',
        title: newContext.title,
        summary: newContext.description,
        connections: [],
        lastUpdated: 'Just now',
        priority: newContext.priority || 'medium'
      };
      setContexts([context, ...contexts]);
      setNewContext({ title: '', description: '', type: 'custom', priority: 'medium' });
      setShowAddContext(false);
      generateInsight(context);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let data;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parsing for contexts
          const lines = content.split('\n');
          data = lines.slice(1).filter(line => line.trim()).map((line, idx) => {
            const [title, summary, type, priority] = line.split(',').map(s => s.trim());
            return {
              id: Date.now() + idx,
              title: title || 'Untitled',
              summary: summary || '',
              type: type || 'custom',
              priority: priority || 'medium',
              connections: [],
              lastUpdated: 'Just now'
            };
          });
        } else {
          alert('Please upload a JSON or CSV file');
          return;
        }

        // Add uploaded contexts
        const newContexts = Array.isArray(data) ? data : [data];
        setContexts([...newContexts.map((ctx, idx) => ({
          ...ctx,
          id: Date.now() + idx,
          lastUpdated: 'Just now'
        })), ...contexts]);
        setShowUpload(false);
        alert(`Successfully imported ${newContexts.length} context(s)`);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteContext = (contextId) => {
    if (confirm('Are you sure you want to delete this context?')) {
      setContexts(contexts.filter(c => c.id !== contextId));
    }
  };

  const handleTakeAction = (insight) => {
    setSelectedInsight(insight);
    setShowActionModal(true);
  };

  const handleSendMessage = async () => {
    if (chatInput.trim()) {
      const userMessage = { role: 'user', content: chatInput, timestamp: new Date() };
      setChatMessages([...chatMessages, userMessage]);
      setChatInput('');

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...chatMessages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            userContexts: contexts
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your API key and try again.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
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
          <button
            onClick={() => handleTakeAction(insight)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Take Action →
          </button>
        )}
      </div>
    );
  };

  const ContextCard = ({ context }) => {
    const priorityColors = {
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    };

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all">
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
          <button
            onClick={() => handleDeleteContext(context.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors ml-2"
            title="Delete context"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {context.connections.map((conn, idx) => (
              <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                {conn}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-500 whitespace-nowrap ml-3">{context.lastUpdated}</span>
        </div>
      </div>
    );
  };

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
            <nav className="flex items-center gap-1">
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
              <StatCard icon={Calendar} label="Connections Made" value={contexts.reduce((sum, c) => sum + c.connections.length, 0)} />
              <StatCard icon={Clock} label="High Priority" value={contexts.filter(c => c.priority === 'high').length} />
            </div>

            {/* Recent Insights */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Insights</h2>
                <button
                  onClick={() => generateInsight({ title: 'General', description: 'System analysis' })}
                  disabled={isGenerating}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <Zap size={14} />
                  {isGenerating ? 'Generating...' : 'Generate New'}
                </button>
              </div>
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <Zap size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 mb-4">No insights yet. Add contexts to generate AI-powered insights.</p>
                  </div>
                ) : (
                  insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))
                )}
              </div>
            </div>

            {/* Priority Contexts */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Priority Contexts</h2>
              <div className="space-y-3">
                {contexts.filter(c => c.priority === 'high').length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <Brain size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No high priority contexts yet.</p>
                  </div>
                ) : (
                  contexts.filter(c => c.priority === 'high').map(context => (
                    <ContextCard key={context.id} context={context} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'contexts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Context Library</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpload(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Upload size={18} />
                  Import
                </button>
                <button
                  onClick={() => setShowAddContext(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  Add Context
                </button>
              </div>
            </div>

            {showAddContext && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">New Context</h3>
                  <button
                    onClick={() => setShowAddContext(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Context title..."
                  value={newContext.title}
                  onChange={(e) => setNewContext({ ...newContext, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Add details about this context..."
                  value={newContext.description}
                  onChange={(e) => setNewContext({ ...newContext, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                />
                <button
                  onClick={handleAddContext}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Context
                </button>
              </div>
            )}

            {showUpload && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Import Contexts</h3>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Upload a JSON or CSV file with your contexts. CSV format: title,summary,type,priority
                </p>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
                />
              </div>
            )}

            <div className="space-y-3">
              {contexts.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                  <Brain size={64} className="text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Contexts Yet</h3>
                  <p className="text-zinc-500 mb-6">Start by adding your first context or importing existing ones.</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setShowUpload(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Upload size={18} />
                      Import File
                    </button>
                    <button
                      onClick={() => setShowAddContext(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus size={18} />
                      Add Manually
                    </button>
                  </div>
                </div>
              ) : (
                contexts.map(context => (
                  <ContextCard key={context.id} context={context} />
                ))
              )}
            </div>
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

      {/* Action Modal */}
      {showActionModal && selectedInsight && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Take Action</h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-6">
              <h4 className="text-white font-medium mb-2">{selectedInsight.title}</h4>
              <p className="text-zinc-400 text-sm">{selectedInsight.message}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Create a new context from the insight
                  const context = {
                    id: Date.now(),
                    type: 'action',
                    title: `Action: ${selectedInsight.title}`,
                    summary: selectedInsight.message,
                    connections: [],
                    lastUpdated: 'Just now',
                    priority: 'high'
                  };
                  setContexts([context, ...contexts]);
                  setShowActionModal(false);
                  alert('Action added to contexts!');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Create Action Context
              </button>
              <button
                onClick={() => {
                  setActiveView('chat');
                  setChatInput(`Help me with: ${selectedInsight.title}`);
                  setShowActionModal(false);
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Discuss in Chat
              </button>
              <button
                onClick={() => {
                  setInsights(insights.filter(i => i.id !== selectedInsight.id));
                  setShowActionModal(false);
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-red-400 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Dismiss Insight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextFlow;