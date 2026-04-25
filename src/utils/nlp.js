// Client-side NLP utilities — no API required

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','it','its','be','was','are','were','been','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'this','that','these','those','i','we','you','he','she','they','them',
  'our','your','his','her','their','my','me','us','him','so','if','as',
  'than','then','when','where','which','who','what','how','all','some',
  'just','more','also','very','can','not','no','up','out','about','into',
])

export function extractKeywords(text, topN = 8) {
  const words = text.toLowerCase().match(/\b[a-z][a-z'-]{2,}\b/g) || []
  const freq = {}
  for (const w of words) {
    if (!STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word)
}

export function detectTopics(text) {
  const TOPIC_MAP = {
    'Machine Learning': ['neural','model','training','dataset','algorithm','feature','prediction','regression','classification','deep learning','gradient','weights','overfitting','epoch','loss'],
    'Mathematics': ['theorem','equation','formula','proof','integral','derivative','matrix','vector','function','calculus','algebra','geometry','probability','statistics'],
    'Biology': ['cell','organism','dna','protein','evolution','gene','species','biology','metabolism','enzyme','chromosome','mitosis','ecosystem'],
    'Physics': ['force','energy','momentum','velocity','acceleration','quantum','particle','wave','field','relativity','electron','photon','thermodynamics'],
    'History': ['century','war','empire','revolution','civilization','dynasty','colonial','treaty','reform','independence','ancient','medieval'],
    'Economics': ['market','supply','demand','inflation','gdp','trade','capital','investment','fiscal','monetary','recession','unemployment'],
    'Computer Science': ['algorithm','data structure','complexity','recursion','binary','array','hash','graph','tree','sorting','programming','software','hardware'],
    'Chemistry': ['molecule','reaction','element','compound','acid','base','bond','electron','oxidation','catalyst','polymer','solution'],
    'Philosophy': ['ethics','logic','argument','epistemology','metaphysics','consciousness','freedom','justice','virtue','dialectic'],
    'Literature': ['narrative','character','plot','theme','symbolism','metaphor','novel','poetry','author','genre'],
  }

  const lower = text.toLowerCase()
  const scores = {}
  for (const [topic, keywords] of Object.entries(TOPIC_MAP)) {
    scores[topic] = keywords.filter(k => lower.includes(k)).length
  }
  const sorted = Object.entries(scores).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1])
  return sorted.slice(0, 3).map(([topic]) => topic)
}

export function extractKeySentences(text, count = 5) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  if (!sentences.length) return []

  const keywords = new Set(extractKeywords(text, 15))

  const scored = sentences.map(s => {
    const words = s.toLowerCase().match(/\b[a-z]+\b/g) || []
    const score = words.filter(w => keywords.has(w)).length / Math.max(words.length, 1)
    const bonusLength = s.length > 40 && s.length < 200 ? 0.1 : 0
    return { sentence: s.trim(), score: score + bonusLength }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.sentence)
}

export function groupByTopic(entries) {
  const groups = {}
  for (const entry of entries) {
    const topics = detectTopics(entry.text)
    const topic = topics[0] || 'General'
    if (!groups[topic]) groups[topic] = []
    groups[topic].push(entry)
  }
  return groups
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function highlightText(text, query) {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>')
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function speakerColor(index) {
  const colors = ['speaker-1', 'speaker-2', 'speaker-3', 'speaker-4']
  return colors[index % colors.length]
}

export function speakerDotColor(index) {
  const colors = ['speaker-dot-1', 'speaker-dot-2', 'speaker-dot-3', 'speaker-dot-4']
  return colors[index % colors.length]
}
