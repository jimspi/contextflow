import React, { useState, useEffect } from 'react';
import { Brain, Zap, Calendar, MessageSquare, TrendingUp, Clock, Plus, X, Send, Upload, Trash2, LogOut, Search, Edit2, ChevronRight, HelpCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useRouter } from 'next/router';
import { processFile } from './lib/fileProcessors';

const Recall = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('home');
  const [notes, setNotes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showEditNote, setShowEditNote] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', description: '', type: 'custom', priority: 'medium' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dragActive, setDragActive] = useState(false);

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Daily summary
  const [dailySummary, setDailySummary] = useState(null);
  const [isDailySummaryGenerating, setIsDailySummaryGenerating] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Check authentication and load data
  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/auth');
      } else {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/auth');
      } else {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId) => {
    try {
      // Load notes (formerly contexts)
      const { data: notesData, error: notesError } = await supabase
        .from('contexts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      if (notesData) {
        setNotes(notesData);
        // Check if new user - show onboarding
        if (notesData.length === 0) {
          setShowOnboarding(true);
        }
      }

      // Load insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;
      if (insightsData) setInsights(insightsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Generate AI insight using OpenAI API - now automatic
  const generateInsight = async (note) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: note, userContexts: notes })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insight');
      }

      const data = await response.json();
      const newInsight = {
        ...data.insight,
        user_id: user.id,
        timestamp: 'Just now'
      };

      // Save to Supabase
      const { data: savedInsight, error: saveError } = await supabase
        .from('insights')
        .insert([newInsight])
        .select()
        .single();

      if (saveError) throw saveError;
      setInsights([savedInsight, ...insights]);

      // Show success message
      showToast('✨ New AI insight generated!', 'success');
    } catch (error) {
      console.error('Error generating insight:', error);
      showToast('⚠️ Failed to generate insight. Please check your API key.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate daily summary
  const generateDailySummary = async () => {
    if (isDailySummaryGenerating) return;

    // Get today's notes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysNotes = notes.filter(note => {
      const noteDate = new Date(note.created_at || note.last_updated);
      noteDate.setHours(0, 0, 0, 0);
      return noteDate.getTime() === today.getTime();
    });

    // If no notes today, show special message
    if (todaysNotes.length === 0) {
      setDailySummary({
        summary: "No new notes today",
        noteCount: 0,
        isEmpty: true
      });
      return;
    }

    setIsDailySummaryGenerating(true);

    try {
      // Create summary of today's notes
      const notesText = todaysNotes.map(note =>
        `${note.title}: ${note.summary || '(no description)'}`
      ).join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Summarize these notes from today in 2-3 sentences, highlighting key themes and priorities:\n\n${notesText}`
          }],
          userContexts: todaysNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate daily summary');
      }

      const data = await response.json();
      setDailySummary({
        summary: data.response,
        noteCount: todaysNotes.length,
        isEmpty: false
      });
    } catch (error) {
      console.error('Error generating daily summary:', error);
      setDailySummary({
        summary: `You added ${todaysNotes.length} note(s) today.`,
        noteCount: todaysNotes.length,
        isEmpty: false
      });
    } finally {
      setIsDailySummaryGenerating(false);
    }
  };

  // Auto-generate daily summary when notes change
  useEffect(() => {
    if (notes.length > 0 && user) {
      generateDailySummary();
    }
  }, [notes.length]);

  const handleAddNote = async () => {
    if (newNote.title.trim()) {
      const note = {
        user_id: user.id,
        type: newNote.type || 'custom',
        title: newNote.title,
        summary: newNote.description,
        connections: [],
        last_updated: new Date().toISOString(),
        priority: newNote.priority || 'medium'
      };

      try {
        // Save to Supabase
        const { data: savedNote, error } = await supabase
          .from('contexts')
          .insert([note])
          .select()
          .single();

        if (error) throw error;

        setNotes([savedNote, ...notes]);
        setNewNote({ title: '', description: '', type: 'custom', priority: 'medium' });
        setShowAddNote(false);

        // Success message and auto-generate insight
        showToast('✅ Note added! Generating AI insights...', 'success');

        // Auto-generate insight
        generateInsight(savedNote);

        // Close onboarding if active
        if (showOnboarding) {
          setOnboardingStep(1);
        }
      } catch (error) {
        console.error('Error adding note:', error);
        showToast('Failed to add note. Please try again.', 'error');
      }
    }
  };

  const handleEditNote = async () => {
    if (editingNote && editingNote.title.trim()) {
      try {
        const { error } = await supabase
          .from('contexts')
          .update({
            title: editingNote.title,
            summary: editingNote.summary,
            priority: editingNote.priority,
            last_updated: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;

        setNotes(notes.map(n => n.id === editingNote.id ? editingNote : n));
        setShowEditNote(false);
        setEditingNote(null);
        showToast('✅ Note updated!', 'success');
      } catch (error) {
        console.error('Error updating note:', error);
        showToast('Failed to update note. Please try again.', 'error');
      }
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    let allNotes = [];
    let successCount = 0;
    let errorCount = 0;

    // Show loading state
    setIsGenerating(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Use the new processFile utility that supports multiple formats
        const result = await processFile(file);

        // Create a note from the extracted content
        const note = {
          title: result.title || file.name,
          summary: result.content || '',
          type: 'imported',
          priority: 'medium',
          connections: [],
          metadata: {
            source: result.source,
            originalFilename: file.name,
            importedAt: new Date().toISOString()
          }
        };

        allNotes.push(note);
        successCount++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errorCount++;
      }
    }

    setIsGenerating(false);

    // Save all successfully processed notes
    if (allNotes.length > 0) {
      try {
        const notesToInsert = allNotes.map(note => ({
          ...note,
          user_id: user.id,
          last_updated: new Date().toISOString()
        }));

        const { data: savedNotes, error } = await supabase
          .from('contexts')
          .insert(notesToInsert)
          .select();

        if (error) throw error;

        setNotes([...savedNotes, ...notes]);
        setShowUpload(false);

        // Generate insights for imported notes automatically
        savedNotes.forEach(note => {
          generateInsight(note);
        });

        let message = `✅ Successfully imported ${savedNotes.length} note(s)!`;
        if (errorCount > 0) {
          message += ` ⚠️ ${errorCount} file(s) failed.`;
        }
        showToast(message, 'success');
      } catch (error) {
        console.error('Error saving notes:', error);
        showToast('Failed to save notes to database.', 'error');
      }
    } else {
      showToast('⚠️ No files could be processed. Please check the file formats.', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const { error } = await supabase
          .from('contexts')
          .delete()
          .eq('id', noteId);

        if (error) throw error;

        setNotes(notes.filter(n => n.id !== noteId));
        showToast('✅ Note deleted', 'success');
      } catch (error) {
        console.error('Error deleting note:', error);
        showToast('Failed to delete note.', 'error');
      }
    }
  };

  const handleQuickAction = async (insight, action) => {
    if (action === 'done') {
      // Mark insight as done by deleting it with visual feedback
      try {
        const { error } = await supabase
          .from('insights')
          .delete()
          .eq('id', insight.id);

        if (error) throw error;
        setInsights(insights.filter(i => i.id !== insight.id));
        showToast('✅ Marked as done!', 'success');
      } catch (error) {
        console.error('Error:', error);
        showToast('⚠️ Failed to mark as done', 'error');
      }
    } else if (action === 'chat') {
      // Go to chat with pre-filled message
      setActiveView('chat');
      setChatInput(`Help me with: ${insight.title}`);
      showToast('💬 Opening chat...', 'info');
    }
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
            userContexts: notes
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
          content: 'Sorry, I encountered an error. Please check your API key.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Filter and search notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || note.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Suggested chat prompts
  const chatSuggestions = [
    "What should I focus on this week?",
    "What have I been neglecting?",
    "Summarize my recent notes",
    "What connections can you find?",
    "Help me prioritize my tasks"
  ];

  const StatCard = ({ icon: Icon, label, value, trend, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    >
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
      {onClick && (
        <div className="mt-3 text-xs text-blue-400 flex items-center gap-1">
          View All <ChevronRight size={14} />
        </div>
      )}
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
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickAction(insight, 'done')}
              className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-600/30 transition-colors"
            >
              ✓ Done
            </button>
            <button
              onClick={() => handleQuickAction(insight, 'chat')}
              className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-600/30 transition-colors"
            >
              💬 Ask AI
            </button>
          </div>
        )}
      </div>
    );
  };

  const NoteCard = ({ note }) => {
    const priorityColors = {
      high: 'bg-red-500/10 text-red-400 border-red-500/20',
      medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    };

    const priorityIcons = {
      high: '🔴',
      medium: '🟡',
      low: '⚪'
    };

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-white font-medium">{note.title}</h4>
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[note.priority]} flex items-center gap-1`}>
                {priorityIcons[note.priority]} {note.priority}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">{note.summary}</p>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => {
                setEditingNote(note);
                setShowEditNote(true);
              }}
              className="text-zinc-500 hover:text-blue-400 transition-colors"
              title="Edit note"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDeleteNote(note.id)}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              title="Delete note"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {note.connections?.map((conn, idx) => (
              <span key={idx} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                {conn}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-500 whitespace-nowrap ml-3">
            {new Date(note.last_updated).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Brain size={64} className="text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
                <h1 className="text-xl font-bold">Recall</h1>
                <p className="text-xs text-zinc-500">AI-Powered Second Brain</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setActiveView('home')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'home' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setActiveView('chat')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  AI Chat
                </button>
              </nav>
              <div className="border-l border-zinc-800 h-6"></div>
              <button
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              <Brain size={48} className="mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold mb-2">Welcome to Recall!</h2>
              <p className="text-zinc-400">Let's get you started in 3 easy steps</p>
            </div>

            {onboardingStep === 0 && (
              <div>
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Add Your First Note
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    Notes can be anything: projects, goals, ideas, reminders, or tasks. Our AI will help you make sense of it all.
                  </p>
                  <button
                    onClick={() => {
                      setShowOnboarding(false);
                      setShowAddNote(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add My First Note
                  </button>
                </div>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="w-full text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Skip tutorial
                </button>
              </div>
            )}

            {onboardingStep === 1 && (
              <div>
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">✓</span>
                    Great! Note Added
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    We're generating AI insights from your note. These insights help you discover connections, remember important things, and stay on track.
                  </p>
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Next: Try AI Chat
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Chat with Your AI Assistant
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    Ask questions about your notes, get suggestions, or have the AI help you plan. It knows everything you've added.
                  </p>
                  <button
                    onClick={() => {
                      setShowOnboarding(false);
                      setActiveView('chat');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Start Chatting
                  </button>
                </div>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="w-full text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  I'll explore on my own
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'home' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Brain}
                label="My Notes"
                value={notes.length}
                onClick={() => {
                  const notesSection = document.getElementById('notes-section');
                  notesSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              <StatCard
                icon={Zap}
                label="AI Insights"
                value={insights.length}
                onClick={() => {
                  const insightsSection = document.getElementById('insights-section');
                  insightsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              <StatCard
                icon={Calendar}
                label="Connections"
                value={notes.reduce((sum, n) => sum + (n.connections?.length || 0), 0)}
              />
              <StatCard
                icon={Clock}
                label="High Priority"
                value={notes.filter(n => n.priority === 'high').length}
                onClick={() => setFilterPriority('high')}
              />
            </div>

            {/* Daily Summary Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Today's Summary</h2>
                {!isDailySummaryGenerating && dailySummary && !dailySummary.isEmpty && (
                  <button
                    onClick={generateDailySummary}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Refresh
                  </button>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-6">
                {isDailySummaryGenerating ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-3"></div>
                    <p className="text-zinc-400">Generating daily summary...</p>
                  </div>
                ) : dailySummary ? (
                  <div>
                    {dailySummary.isEmpty ? (
                      <div className="text-center py-4">
                        <Calendar size={48} className="text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-400 text-lg mb-2">No new notes today</p>
                        <p className="text-zinc-600 text-sm">Add a note to start your day!</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar size={20} className="text-blue-400" />
                          <span className="text-sm text-blue-300 font-medium">
                            {dailySummary.noteCount} note{dailySummary.noteCount !== 1 ? 's' : ''} added today
                          </span>
                        </div>
                        <p className="text-white leading-relaxed">{dailySummary.summary}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">Loading daily summary...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Insights Section */}
            <div className="mb-8" id="insights-section">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">AI Insights</h2>
              </div>
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <Zap size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 mb-4">No insights yet. Add notes to get AI-powered insights automatically!</p>
                    <button
                      onClick={() => setShowAddNote(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Your First Note
                    </button>
                  </div>
                ) : (
                  insights.slice(0, 5).map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div id="notes-section">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">All Notes ({filteredNotes.length})</h2>

                <div className="flex flex-col md:flex-row gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="search"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">⚪ Low</option>
                  </select>

                  {/* Actions */}
                  <button
                    onClick={() => setShowUpload(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Upload size={18} />
                    Import
                  </button>
                  <button
                    onClick={() => setShowAddNote(true)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Add Note
                  </button>
                </div>
              </div>

              {/* Add Note Modal */}
              {showAddNote && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add New Note</h3>
                    <button
                      onClick={() => setShowAddNote(false)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Note title (e.g., 'Q4 Product Launch' or 'Learn Spanish')"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                  <textarea
                    placeholder="Add details about this note..."
                    value={newNote.description}
                    onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <label className="text-sm text-zinc-400 mb-2 flex items-center gap-1">
                        Priority (How urgent is this?)
                        <HelpCircle size={14} className="text-zinc-600" />
                      </label>
                      <select
                        value={newNote.priority}
                        onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="low">⚪ Low - Can wait</option>
                        <option value="medium">🟡 Medium - Important</option>
                        <option value="high">🔴 High - Urgent</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddNote}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              )}

              {/* Edit Note Modal */}
              {showEditNote && editingNote && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Note</h3>
                    <button
                      onClick={() => {
                        setShowEditNote(false);
                        setEditingNote(null);
                      }}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <textarea
                    placeholder="Add details..."
                    value={editingNote.summary || ''}
                    onChange={(e) => setEditingNote({ ...editingNote, summary: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />
                  <div className="flex-1 mb-4">
                    <label className="text-sm text-zinc-400 mb-2 block">Priority</label>
                    <select
                      value={editingNote.priority}
                      onChange={(e) => setEditingNote({ ...editingNote, priority: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="low">⚪ Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                  <button
                    onClick={handleEditNote}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {/* Upload Modal with Drag & Drop */}
              {showUpload && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Import Notes</h3>
                    <button
                      onClick={() => setShowUpload(false)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <Upload size={48} className={`mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                    <p className="text-white mb-2">
                      {dragActive ? 'Drop files here' : 'Drag and drop files here'}
                    </p>
                    <p className="text-sm text-zinc-500 mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".json,.csv,.txt,.docx,.pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>

                  <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-2">Supported formats:</p>
                    <ul className="text-xs text-zinc-500 space-y-1">
                      <li>• Word Documents (.docx) - Text will be extracted automatically</li>
                      <li>• PDF Files (.pdf) - Text will be extracted automatically</li>
                      <li>• Images (.jpg, .jpeg, .png) - Text will be extracted using OCR</li>
                      <li>• CSV Files (.csv) - Format: title,summary,type,priority</li>
                      <li>• JSON Files (.json) - Array of note objects</li>
                      <li>• Text Files (.txt) - Plain text content</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div className="space-y-3">
                {filteredNotes.length === 0 && notes.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                    <Brain size={64} className="text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Start with your first note</h3>
                    <p className="text-zinc-500 mb-6">
                      Add anything: projects, goals, ideas, or reminders. Our AI will help you stay organized.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setShowUpload(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <Upload size={18} />
                        Import File
                      </button>
                      <button
                        onClick={() => setShowAddNote(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <Plus size={18} />
                        Add Manually
                      </button>
                    </div>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                    <Search size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No notes match your search or filter.</p>
                  </div>
                ) : (
                  filteredNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'chat' && (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            <h2 className="text-2xl font-bold mb-4">AI Chat Assistant</h2>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-6 overflow-y-auto mb-4">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <MessageSquare size={48} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 mb-6">Ask me anything about your notes, goals, or get suggestions!</p>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-600 mb-3">Try asking:</p>
                      {chatSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setChatInput(suggestion)}
                          className="block w-full text-left text-sm text-blue-400 hover:text-blue-300 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded transition-colors"
                        >
                          "{suggestion}"
                        </button>
                      ))}
                    </div>
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
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
                placeholder="Ask me anything about your notes..."
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

      {/* Floating Quick Add Button */}
      <button
        onClick={() => setShowAddNote(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-40"
        title="Quick add note"
      >
        <Plus size={24} />
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
          <div className={`
            px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]
            ${toast.type === 'success' ? 'bg-green-600 border border-green-500' : ''}
            ${toast.type === 'error' ? 'bg-red-600 border border-red-500' : ''}
            ${toast.type === 'info' ? 'bg-blue-600 border border-blue-500' : ''}
          `}>
            <span className="text-white font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recall;
