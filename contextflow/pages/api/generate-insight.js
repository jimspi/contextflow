// pages/api/generate-insight.js
// This API route integrates with OpenAI to generate contextual insights

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OpenAI API key not configured',
      details: 'Please set OPENAI_API_KEY in your environment variables'
    });
  }

  const { context, userContexts } = req.body;

  // Validate request body
  if (!context) {
    return res.status(400).json({
      error: 'Missing required field: context'
    });
  }

  try {
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
            content: `You are ContextFlow, an AI assistant that maintains a continuous understanding of the user's work, life, and goals. You analyze their contexts, detect patterns, and surface proactive insights.

Current user contexts: ${JSON.stringify(userContexts || [])}

Analyze the provided context and generate a relevant, actionable insight. Focus on:
- Connections between different contexts
- Long-term goals that may need attention
- Opportunities for optimization or reconnection
- Time-sensitive actions

Respond in JSON format with: { "type": "opportunity|reminder|conflict|analysis", "title": "string", "message": "string", "actionable": boolean }`
          },
          {
            role: 'user',
            content: `Analyze this context: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    let insight;
    try {
      insight = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, create a fallback insight
      insight = {
        type: 'analysis',
        title: `Insight for: ${context.title || 'Context'}`,
        message: data.choices[0].message.content,
        actionable: false
      };
    }

    return res.status(200).json({
      insight: {
        ...insight,
        timestamp: 'Just now'
      }
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate insight',
      details: error.message
    });
  }
}
