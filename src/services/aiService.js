// AI service — supports OpenAI (direct browser) and Anthropic (via user proxy)
// Users provide their own API key stored in localStorage

const PROMPTS = {
  summarize: (text) => `You are a professional academic note-taker. Summarize the following lecture transcript.

Return a JSON object with this exact structure:
{
  "bulletPoints": ["key point 1", "key point 2", ...],
  "keyConcepts": ["concept 1", "concept 2", ...],
  "definitions": [{"term": "term", "definition": "definition"}, ...],
  "actionItems": ["action 1", ...]
}

Keep bullet points concise (max 15 words each). Include 3-6 bullet points, 3-5 key concepts, any important definitions, and any action items mentioned.

Transcript:
${text}`,

  flashcards: (text) => `Generate 6-10 flashcards from this lecture content. Return JSON array:
[{"question": "...", "answer": "...", "topic": "..."}]

Focus on key concepts, definitions, and important facts. Make questions clear and answers concise.

Content:
${text}`,

  quiz: (text) => `Create a 5-question multiple-choice quiz from this lecture content. Return JSON array:
[{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": 0,
  "explanation": "..."
}]

"correct" is the 0-based index of the correct option.

Content:
${text}`,

  explain: (text) => `Explain the following lecture content simply, as if talking to a curious 15-year-old.
Use analogies and plain language. Keep it under 150 words.

Content:
${text}`,

  translate: (text, lang) => `Translate the following text to ${lang}. Return only the translation, nothing else.

Text:
${text}`,
}

async function callOpenAI(prompt, apiKey, model = 'gpt-4o-mini') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callAnthropic(prompt, apiKey, proxyUrl) {
  const endpoint = proxyUrl || 'https://api.anthropic.com/v1/messages'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic API error ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callAI(prompt, settings) {
  const { aiProvider, apiKey, proxyUrl } = settings
  if (!apiKey) throw new Error('No API key configured. Add your key in Settings.')

  if (aiProvider === 'anthropic') {
    return callAnthropic(prompt, apiKey, proxyUrl)
  }
  return callOpenAI(prompt, apiKey)
}

function parseJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  try {
    return JSON.parse(match ? match[1] || match[0] : text)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }
}

export async function generateSummary(transcript, settings) {
  const text = transcript.map(e => e.text).join(' ')
  if (text.trim().length < 50) throw new Error('Not enough content to summarize yet.')

  const raw = await callAI(PROMPTS.summarize(text), settings)
  return parseJSON(raw)
}

export async function generateFlashcards(transcript, settings) {
  const text = transcript.map(e => e.text).join(' ')
  if (text.trim().length < 100) throw new Error('Not enough content for flashcards.')

  const raw = await callAI(PROMPTS.flashcards(text), settings)
  return parseJSON(raw)
}

export async function generateQuiz(transcript, settings) {
  const text = transcript.map(e => e.text).join(' ')
  if (text.trim().length < 100) throw new Error('Not enough content for a quiz.')

  const raw = await callAI(PROMPTS.quiz(text), settings)
  return parseJSON(raw)
}

export async function explainSimply(text, settings) {
  return callAI(PROMPTS.explain(text), settings)
}

export async function translateText(text, targetLang, settings) {
  return callAI(PROMPTS.translate(text, targetLang), settings)
}
