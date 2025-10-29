'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Zap, Calendar, MessageSquare, TrendingUp, Clock, Plus, X, Send, Upload, FileText, Folder } from 'lucide-react';

const ContextFlow = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [contexts, setContexts] = useState([
    {
      id: 1,
      type: 'project',
      title: 'Q4 Product Launch',
      summary: 'Coordinating with design and engineering teams',
      connections: ['Sarah Chen', 'Product roadmap', 'Marketing plan'],
      lastUpdated: '2 hours ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'personal',
      title: 'Learning Spanish',
      summary: 'Mentioned 3 months ago, no recent progress',
      connections: ['Language goals', 'Travel plans'],
      lastUpdated: '3 months ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'professional',
      title: 'Sarah Chen - Climate Tech',
      summary: 'Met at Denver conference, discussed collaboration',
      connections: ['Networking', 'Climate initiatives'],
      lastUpdated: '2 weeks ago',
      priority: 'medium'
    }
  ]);

  const [insights, setInsights] = useState([
    {
      id: 1,
      type: 'opportunity',
      title: 'Reconnection Opportunity',
      message: 'Sarah from Denver conference is in your area. You mentioned wanting to reconnect about climate tech collaboration.',
      timestamp: '10 minutes ago',
      actionable: true
    },
    {
      id: 2,
      type: 'reminder',
      title: 'Long-term Goal Check',
      message: 'Your Spanish learning goal has been inactive for 3 months. There are language exchange meetups this week.',
      timestamp: '1 hour ago',
      actionable: true
    },
    {
      id: 3,
      type: 'conflict',
      title: 'Schedule Optimization',
      message: 'Three meetings tomorrow could be consolidated to create 90 minutes of focused work time.',
      timestamp: '3 hours ago',
      actionable: true
    }
  ]);

  const [showAddContext, setShowAddContext] = useState(false);
  const [newContext, setNewContext] = useState({ title: '', description: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Generate insights using OpenAI API
  const generateInsight = async (context) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          userContexts: contexts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      const newInsight = {
        id: insights.length + 1,
        ...data.insight
      };

      setInsights([newInsight, ...insights]);
    } catch (error) {
      console.error('Error generating insight:', error);
      // Fallback to a basic insight if API fails
      const newInsight = {
        id: insights.length + 1,
        type: 'analysis',
        title: `Analysis: ${context.title}`,
        message: `Added new context about ${context.title}. Consider how this connects to your other goals and projects.`,
        timestamp: 'Just now',
        actionable: false
      };
      setInsights([newInsight, ...insights]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddContext = () => {
    if (newContext.title.trim()) {
      const context = {
        id: contexts.length + 1,
        type: 'custom',
        title: newContext.title,
        summary: newContext.description,
        connections: [],
        lastUpdated: 'Just now',
        priority: 'medium'
      };
      setContexts([context, ...contexts]);
      setNewContext({ title: '', description: '' });
      setShowAddContext(false);
      generateInsight(context);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const newFiles = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const fileContext = {
          id: contexts.length + newFiles.length + 1,
          type: 'document',
          title: file.name,
          summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          fullContent: text,
          connections: [],
          lastUpdated: 'Just now',
          priority: 'medium',
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleDateString()
          }
        };

        newFiles.push(fileContext);
        setUploadedFiles(prev => [...prev, file.name]);

        // Generate insight for each uploaded file
        await generateInsight(fileContext);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    if (newFiles.length > 0) {
      setContexts([...newFiles, ...contexts]);
      setShowFileUpload(false);
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

      // Simulate AI response
      setTimeout(() => {
        const aiMessage = {
          role: 'assistant',
          content: 'This is where ContextFlow would provide intelligent responses based on your entire context graph. In production, this connects to OpenAI API with your full context as system prompt.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }, 1000);
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

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {context.type === 'document' && <FileText size={16} className="text-emerald-400" />}
              <h4 className="text-white font-medium">{context.title}</h4>
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[context.priority]}`}>
                {context.priority}
              </span>
              {context.type === 'document' && (
                <span className="text-xs px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  file
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm">{context.summary}</p>
            {context.fileInfo && (
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                <span>{formatFileSize(context.fileInfo.size)}</span>
                <span>•</span>
                <span>Modified: {context.fileInfo.lastModified}</span>
              </div>
            )}
          </div>
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
              <StatCard icon={Brain} label="Active Contexts" value={contexts.length} trend="+2 this week" />
              <StatCard icon={Zap} label="Insights Generated" value="47" trend="+12 today" />
              <StatCard icon={Calendar} label="Connections Made" value="156" trend="+8 this week" />
              <StatCard icon={Clock} label="Avg Response Time" value="1.2s" trend="-0.3s faster" />
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
                {insights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>

            {/* Priority Contexts */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Priority Contexts</h2>
              <div className="space-y-3">
                {contexts.filter(c => c.priority === 'high').map(context => (
                  <ContextCard key={context.id} context={context} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'contexts' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Context Library</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Upload size={18} />
                  Upload Files
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

            {showFileUpload && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Upload Files</h3>
                  <button
                    onClick={() => setShowFileUpload(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-600 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".txt,.md,.json,.js,.py,.java,.cpp,.c,.html,.css,.xml,.log"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="bg-zinc-800 p-4 rounded-full">
                      <Folder size={32} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Click to browse files</p>
                      <p className="text-sm text-zinc-500">
                        Supports text files, code, markdown, JSON, and logs
                      </p>
                    </div>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-zinc-400 mb-2">Recently uploaded:</p>
                    <div className="space-y-2">
                      {uploadedFiles.slice(-5).map((fileName, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                          <FileText size={14} className="text-emerald-400" />
                          {fileName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {contexts.map(context => (
                <ContextCard key={context.id} context={context} />
              ))}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Take Action</h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-2">{selectedInsight.title}</h4>
                <p className="text-zinc-400 text-sm">{selectedInsight.message}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium text-sm">Suggested Actions:</h4>

                {selectedInsight.type === 'opportunity' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('chat');
                        setChatInput(`Tell me more about this opportunity: ${selectedInsight.title}`);
                        setShowActionModal(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>Discuss in Chat</span>
                      <MessageSquare size={18} />
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between">
                      <span>Add to Calendar</span>
                      <Calendar size={18} />
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between">
                      <span>Create Reminder</span>
                      <Clock size={18} />
                    </button>
                  </div>
                )}

                {selectedInsight.type === 'reminder' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('contexts');
                        setShowActionModal(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>View Related Context</span>
                      <Brain size={18} />
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between">
                      <span>Set New Goal</span>
                      <TrendingUp size={18} />
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between">
                      <span>Schedule Time</span>
                      <Calendar size={18} />
                    </button>
                  </div>
                )}

                {selectedInsight.type === 'conflict' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('chat');
                        setChatInput(`Help me resolve this conflict: ${selectedInsight.title}`);
                        setShowActionModal(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>Get AI Suggestions</span>
                      <MessageSquare size={18} />
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between">
                      <span>Reschedule Events</span>
                      <Calendar size={18} />
                    </button>
                  </div>
                )}

                {selectedInsight.type === 'analysis' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveView('chat');
                        setChatInput(`Analyze this further: ${selectedInsight.title}`);
                        setShowActionModal(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>Deep Dive in Chat</span>
                      <MessageSquare size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('contexts');
                        setShowActionModal(false);
                      }}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>View All Contexts</span>
                      <Brain size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowActionModal(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextFlow;