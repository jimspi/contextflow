// pages/api/chat.js
// This API route handles context-aware conversations

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, userContexts } = req.body;

  try {
    // Build system message with user's full context
    const contextSummary = userContexts?.map(ctx => 
      `- ${ctx.title}: ${ctx.summary} (Priority: ${ctx.priority}, Last updated: ${ctx.lastUpdated})`
    ).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are ContextFlow, a personal AI assistant with persistent memory of the user's life, work, and goals. You have access to their complete context graph.

User's Current Contexts:
${contextSummary || 'No contexts yet'}

Use this context to provide personalized, relevant responses. Reference specific contexts when relevant. Be proactive about surfacing connections, reminders, and opportunities based on what you know about the user.`
          },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return res.status(200).json({
      message: data.choices[0].message.content,
      usage: data.usage
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
}
