// pages/api/generate-insight.js
// This API route integrates with OpenAI to generate contextual insights

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, userContexts } = req.body;

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
            content: `You are ContextFlow, an AI assistant that maintains a continuous understanding of the user's work, life, and goals. You are an expert at analyzing contexts, detecting patterns, and surfacing proactive, deeply insightful recommendations.

Current user contexts: ${JSON.stringify(userContexts || [])}

Your task is to generate a detailed, actionable insight by analyzing the provided context in relation to all user contexts.

ANALYSIS FRAMEWORK:
1. PATTERN DETECTION: Look for recurring themes, connections, or conflicts across contexts
2. PRIORITY ASSESSMENT: Identify what needs immediate attention vs long-term planning
3. OPPORTUNITY IDENTIFICATION: Find synergies, optimization potential, or reconnection opportunities
4. TIME SENSITIVITY: Flag actions that are time-critical or becoming stale
5. DEPTH OF INSIGHT: Go beyond surface observations - provide WHY something matters and WHAT specific impact it could have

INSIGHT QUALITY STANDARDS:
- Be SPECIFIC: Use concrete details from the contexts
- Be ACTIONABLE: Suggest clear next steps when possible
- Be INSIGHTFUL: Reveal non-obvious connections or implications
- Be RELEVANT: Focus on what truly matters to the user's goals
- Be DETAILED: Provide rich context and reasoning (3-5 sentences when needed)

EXAMPLE OF GOOD INSIGHT:
Instead of: "You haven't practiced Spanish lately"
Write: "Your Spanish learning goal has been inactive for 3 months, but there are 2 language exchange meetups this week in your area. Given your upcoming travel plans mentioned in your Q4 contexts, this could be an ideal time to reinvigorate this goal. Consider blocking 30 minutes before the meetups to review basics."

Respond in JSON format with: { "type": "opportunity|reminder|conflict|analysis", "title": "string (concise, compelling)", "message": "string (detailed, 2-5 sentences)", "actionable": boolean }`
          },
          {
            role: 'user',
            content: `Analyze this context and generate a high-quality insight: ${JSON.stringify(context)}

Look for connections to other contexts, potential optimizations, time-sensitive actions, and meaningful patterns. Be specific and insightful.`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const insight = JSON.parse(data.choices[0].message.content);
    
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
