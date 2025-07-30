export default async function handler(req, res) {
  // Set CORS headers - restrict to specific origins in production
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://storytime.rickysoo.com', 'https://storytime-flame-eta.vercel.app'] // Official domain and Vercel deployment
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', false);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trainingDetails, personalStatement } = req.body;

    // Input validation
    if (!trainingDetails || !personalStatement) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (typeof trainingDetails !== 'string' || typeof personalStatement !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }
    
    // Length validation to prevent excessive API usage
    if (trainingDetails.length > 2000 || personalStatement.length > 1000) {
      return res.status(400).json({ error: 'Input too long' });
    }
    
    // Basic content sanitization
    const sanitizedTraining = trainingDetails.replace(/[<>"'&]/g, '');
    const sanitizedPersonal = personalStatement.replace(/[<>"'&]/g, '');
    
    const formData = {
      trainingDetails: sanitizedTraining,
      personalStatement: sanitizedPersonal
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    const prompt = createStoryPrompt(formData);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional training story writer who creates funny, engaging, and educational narratives. Your stories should be humorous yet meaningful, with workplace comedy that makes learning memorable while delivering clear training value. Think of yourself as a comedian who also happens to be an excellent trainer - your stories should make people laugh while they learn.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      let errorMessage = `OpenAI API request failed (${response.status})`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        errorMessage = 'API request failed';
      }
      
      console.error('OpenAI API Error:', errorMessage);
      return res.status(500).json({ error: 'Story generation temporarily unavailable' });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response format from OpenAI API' });
    }
    
    const story = data.choices[0].message.content.trim();
    
    return res.status(200).json({ story });

  } catch (error) {
    console.error('Story generation error:', error);
    return res.status(500).json({ 
      error: 'Service temporarily unavailable. Please try again.' 
    });
  }
}

function createStoryPrompt(formData) {
  return `Create a personalized first-person training story based on the following information:

TRAINING SESSION DETAILS:
${formData.trainingDetails}

PERSONAL DETAIL ABOUT THE TRAINER:
${formData.personalStatement}

CRITICAL REQUIREMENTS:
- MUST write the story in FIRST PERSON using "I", "me", "my" throughout the entire story
- NEVER use third-person pronouns like "she", "he", "Sarah", or any character names
- The story narrator IS the trainer themselves telling their own experience
- Start sentences with "I" - for example: "I was working in...", "I noticed...", "I decided to..."
- Incorporate the personal detail about the trainer naturally into the first-person narrative
- Show how "I" faced realistic workplace challenges related to the training topic
- Demonstrate how "I" applied the training concepts to overcome obstacles
- Keep the story to exactly 400 words or less
- Format the response as clean HTML with appropriate tags (no markdown)
- Use single line spacing throughout, avoid double spacing between lines

STORY TONE REQUIREMENTS:
- Make the story FUNNY and engaging with humor, light moments, or amusing situations
- Include relatable workplace comedy (awkward moments, funny misunderstandings, quirky colleagues)
- Use the trainer's personal detail in a humorous way if possible
- Add amusing dialogue or internal thoughts
- Keep it professional but entertaining - appropriate for workplace training
- Balance humor with meaningful learning outcomes
- The comedy should enhance, not distract from, the training message

Example opening: "I was working as a [role] when I encountered the most ridiculous situation..." or "Little did I know that my [personal detail] would save the day in the most unexpected way..."

Structure your HTML response as:
<div class="story-section">
<h3>The Story</h3>
<p>[Funny first-person opening: "I was working in... when the most ridiculous thing happened..." - set the scene with humor and "I"]</p>
<p>[Amusing challenge paragraph: "I couldn't believe it when..." "The situation got even more absurd..." - present the problem with comedic elements from my perspective]</p>
<p>[Clever resolution paragraph: "That's when I remembered..." "Using my [personal detail] and [training concept], I managed to..." - show how I solved it with both humor and meaningful learning]</p>
</div>

<div class="training-section">
<h3>Training Application</h3>
<div class="application-overview">
<h4>Story Relevance</h4>
<p>[2-3 sentences explaining how this story directly connects to the training objectives and why it resonates with the target audience]</p>
</div>

<div class="facilitation-guide">
<h4>How to Use This Story</h4>
<ul>
<li><strong>Opening Activity:</strong> [Detailed suggestion for introducing the story - timing, setup, participant engagement]</li>
<li><strong>Discussion Questions:</strong> [2-3 specific questions to facilitate meaningful group discussion, with follow-up prompts - format as single line spacing, not double spacing]</li>
<li><strong>Learning Connection:</strong> [Explicit guidance on linking story elements to key training concepts and real workplace scenarios]</li>
<li><strong>Action Planning:</strong> [Specific steps participants can take to apply the lessons in their own work environment]</li>
</ul>
</div>

<div class="trainer-tips">
<h4>Trainer Notes</h4>
<p>[Practical tips for delivery, potential participant reactions to anticipate, and ways to adapt the story for different group dynamics]</p>
</div>
</div>

Ensure the HTML is well-formatted, uses semantic tags, and creates a professional appearance when rendered. Use single line spacing throughout - no double spacing between sentences or paragraphs. The Training Application section should be comprehensive and provide detailed guidance for effective story utilization. Do not include any markdown formatting (**, ##, etc.) - use only HTML tags.`;
}