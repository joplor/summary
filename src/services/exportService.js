import { jsPDF } from 'jspdf'
import { formatDuration } from '../utils/nlp.js'

function buildMarkdown(session) {
  const { transcript, summaries, notes, startTime, name } = session
  const date = new Date(startTime).toLocaleString()
  const lines = []

  lines.push(`# ${name || 'Lecture Notes'}`)
  lines.push(`*Recorded on ${date}*\n`)

  if (summaries.length > 0) {
    lines.push('## Summary\n')
    const last = summaries[summaries.length - 1]
    if (last.bulletPoints?.length) {
      lines.push('### Key Points')
      last.bulletPoints.forEach(p => lines.push(`- ${p}`))
      lines.push('')
    }
    if (last.keyConcepts?.length) {
      lines.push('### Key Concepts')
      last.keyConcepts.forEach(c => lines.push(`- ${c}`))
      lines.push('')
    }
    if (last.definitions?.length) {
      lines.push('### Definitions')
      last.definitions.forEach(d => lines.push(`**${d.term}**: ${d.definition}`))
      lines.push('')
    }
    if (last.actionItems?.length) {
      lines.push('### Action Items')
      last.actionItems.forEach(a => lines.push(`- [ ] ${a}`))
      lines.push('')
    }
  }

  if (notes.filter(n => n.pinned).length > 0) {
    lines.push('## Pinned Notes\n')
    notes.filter(n => n.pinned).forEach(n => lines.push(`- ${n.text}`))
    lines.push('')
  }

  if (transcript.length > 0) {
    lines.push('## Full Transcript\n')
    transcript.forEach(entry => {
      const time = formatDuration(Math.floor((entry.timestamp - startTime) / 1000))
      lines.push(`**[${time}] ${entry.speaker}:** ${entry.text}\n`)
    })
  }

  return lines.join('\n')
}

export function exportMarkdown(session) {
  const md = buildMarkdown(session)
  const blob = new Blob([md], { type: 'text/markdown' })
  downloadBlob(blob, `${sanitizeName(session.name)}.md`)
}

export function exportTxt(session) {
  const { transcript, summaries, notes, startTime, name } = session
  const lines = []

  lines.push(`${name || 'Lecture Notes'}`)
  lines.push(`Recorded: ${new Date(startTime).toLocaleString()}`)
  lines.push('='.repeat(60))
  lines.push('')

  if (summaries.length > 0) {
    const last = summaries[summaries.length - 1]
    lines.push('SUMMARY')
    lines.push('-'.repeat(30))
    last.bulletPoints?.forEach(p => lines.push(`• ${p}`))
    lines.push('')
  }

  if (transcript.length > 0) {
    lines.push('TRANSCRIPT')
    lines.push('-'.repeat(30))
    transcript.forEach(entry => {
      const time = formatDuration(Math.floor((entry.timestamp - startTime) / 1000))
      lines.push(`[${time}] ${entry.speaker}: ${entry.text}`)
    })
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  downloadBlob(blob, `${sanitizeName(session.name)}.txt`)
}

export function exportPDF(session) {
  const { transcript, summaries, notes, startTime, name } = session
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const MARGIN = 18
  const contentW = W - MARGIN * 2
  let y = MARGIN

  // Helper: add text with wrapping
  const addText = (text, fontSize = 10, color = [15, 23, 42], bold = false) => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(String(text), contentW)
    if (y + lines.length * (fontSize * 0.4) > 280) {
      doc.addPage()
      y = MARGIN
    }
    doc.text(lines, MARGIN, y)
    y += lines.length * (fontSize * 0.4) + 2
    return lines.length
  }

  const addSpacer = (h = 4) => { y += h }
  const addDivider = () => {
    doc.setDrawColor(229, 231, 235)
    doc.line(MARGIN, y, W - MARGIN, y)
    y += 4
  }

  // Header gradient rect
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, W, 28, 'F')

  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(name || 'Lecture Notes', MARGIN, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date(startTime).toLocaleString(), MARGIN, 21)

  y = 38

  // Summary section
  if (summaries.length > 0) {
    const last = summaries[summaries.length - 1]

    addText('SUMMARY', 13, [99, 102, 241], true)
    addDivider()

    if (last.bulletPoints?.length) {
      addText('Key Points', 10, [71, 85, 105], true)
      addSpacer(1)
      last.bulletPoints.forEach(p => addText(`• ${p}`, 9, [15, 23, 42]))
      addSpacer(3)
    }

    if (last.keyConcepts?.length) {
      addText('Key Concepts', 10, [71, 85, 105], true)
      addSpacer(1)
      addText(last.keyConcepts.join(' · '), 9, [99, 102, 241])
      addSpacer(3)
    }

    if (last.definitions?.length) {
      addText('Definitions', 10, [71, 85, 105], true)
      addSpacer(1)
      last.definitions.forEach(d => {
        addText(`${d.term}: ${d.definition}`, 9, [15, 23, 42])
      })
      addSpacer(3)
    }

    if (last.actionItems?.length) {
      addText('Action Items', 10, [71, 85, 105], true)
      addSpacer(1)
      last.actionItems.forEach(a => addText(`☐ ${a}`, 9, [15, 23, 42]))
      addSpacer(3)
    }
  }

  // Pinned notes
  const pinned = notes.filter(n => n.pinned)
  if (pinned.length) {
    addSpacer(2)
    addText('PINNED NOTES', 13, [99, 102, 241], true)
    addDivider()
    pinned.forEach(n => addText(`★ ${n.text}`, 9, [15, 23, 42]))
    addSpacer(4)
  }

  // Transcript
  if (transcript.length) {
    doc.addPage()
    y = MARGIN
    addText('FULL TRANSCRIPT', 13, [99, 102, 241], true)
    addDivider()

    transcript.forEach(entry => {
      const time = formatDuration(Math.floor((entry.timestamp - startTime) / 1000))
      addText(`[${time}] ${entry.speaker}`, 8, [100, 116, 139], true)
      addText(entry.text, 9, [15, 23, 42])
      addSpacer(2)
    })
  }

  doc.save(`${sanitizeName(session.name)}.pdf`)
}

function sanitizeName(name) {
  return (name || 'lecture-notes').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
