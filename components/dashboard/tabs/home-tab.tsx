'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLocation } from '@/lib/LocationContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const defaultSuggestions = [
  'What are the best restaurants nearby?',
  'Tell me about local attractions',
  'What is the history of this area?',
  'Best hidden gems near me?'
]

export function HomeTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user: currentUser } = useAuth()
  const { locationName } = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions)
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const sessionId = useRef(Date.now().toString())
  const recognitionRef = useRef<any>(null)
  const isAudioMutedRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const pendingVisionRef = useRef<string | null>(null)
  const audioCtxRef = useRef<any>(null)
  const micStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const unlock = async () => {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass()
        }
        await audioCtxRef.current.resume()
      } catch {}
    }
    document.addEventListener('touchstart', unlock, { once: true })
    document.addEventListener('mousedown', unlock, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('mousedown', unlock)
    }
  }, [])

  // ── SUGGESTIONS — exact copy from chat-tab.tsx ──
  const generateSuggestions = async (chatMessages: Message[]) => {
    try {
      const lastMessages = chatMessages.slice(-4)
      if (lastMessages.length === 0) { setSuggestions(defaultSuggestions); return }
      const conversationForSuggestions = lastMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: `Generate exactly 3 short travel follow-up questions under 8 words each based on this conversation. Return ONLY a valid JSON array with exactly 3 string elements like this example: ["What is the history?","How do I get there?","What should I eat?"]. Do not return q1 q2 q3. Do not use markdown. Do not add any explanation. Just the JSON array.`
            },
            { role: 'user', content: conversationForSuggestions }
          ]
        })
      })
      const data = await response.json()
      const raw = data.message?.trim() || '[]'
      // Remove any markdown code blocks if present
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      try {
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((s: any) => typeof s === 'string' && s !== 'q1' && s !== 'q2' && s !== 'q3')) {
          setSuggestions(parsed)
        } else {
          setSuggestions(defaultSuggestions)
        }
      } catch {
        setSuggestions(defaultSuggestions)
      }
    } catch { }
  }

  // ── SAVE HISTORY — exact copy from chat-tab.tsx but collection = avatarHistory ──
  const saveAvatarHistory = async (chatMessages: Message[]) => {
    if (!currentUser) return
    try {
      const { db } = await import('@/firebase.config')
      const { setDoc, doc } = await import('firebase/firestore')
      const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user')?.content || ''
      const lastAIResponse = [...chatMessages].reverse().find(m => m.role === 'assistant')?.content || ''
      await setDoc(doc(db, 'avatarHistory', sessionId.current), {
        userId: currentUser.uid,
        messages: chatMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
        })),
        lastMessage: lastUserMessage,
        aiLastResponse: lastAIResponse,
        location: locationName || '',
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log('✅ Avatar history saved')
    } catch (err) {
      console.error('Failed to save avatar history:', err)
    }
  }

  // ── TTS VIA OPENAI ──
  const speakText = async (text: string) => {
    try {
      const clean = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/\d+\.\s/g, '')
        .replace(/\n+/g, ' ')
        .trim()

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.onplay = () => setAvatarStatus('speaking')
      audio.onended = () => { setAvatarStatus('idle'); URL.revokeObjectURL(url) }
      audio.onerror = () => { setAvatarStatus('idle'); URL.revokeObjectURL(url) }
      await audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      setAvatarStatus('idle')
    }
  }

  // ── HANDLE MESSAGE ──
  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    setAvatarStatus('thinking')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    const updated = [...messagesRef.current, userMsg]
    setMessages(updated)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: `You are Atlas, a friendly AI travel guide. Only answer travel questions. Keep responses under 4 sentences. Always end with a question.${locationName ? ` User is near ${locationName}.` : ''}`
        })
      })
      const data = await res.json()
      const reply = data.message || ''
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date() }
      const final = [...updated, aiMsg]
      setMessages(final)

      if (!isAudioMutedRef.current) {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: reply })
          })
          const arrayBuffer = await ttsRes.arrayBuffer()
          const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContextClass()
          }
          if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume()
          }
          const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer)
          const source = audioCtxRef.current.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioCtxRef.current.destination)
          setAvatarStatus('speaking')
          source.start(0)
          source.onended = () => { setAvatarStatus('idle') }
        } catch {
          setAvatarStatus('idle')
        }
      } else {
        setAvatarStatus('idle')
      }

      setTimeout(() => { generateSuggestions(final); saveAvatarHistory(final) }, 0)
    } catch (err) {
      console.error('handleMessage error:', err)
      setAvatarStatus('idle')
    }
  }, [locationName, currentUser])

  // ── MIC BUTTON ──
  const startListening = async () => {
    if (avatarStatus === 'speaking') return
    window.speechSynthesis.cancel()

    // Unlock AudioContext on iOS — must happen inside user gesture
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass()
        }
        await audioCtxRef.current.resume()
      }
    } catch {}

    // If coming from Vision, fire that message now (needs user gesture for audio)
    if (pendingVisionRef.current) {
      const msg = pendingVisionRef.current
      pendingVisionRef.current = null
      handleUserMessage(msg)
      return
    }

    // Stop any existing stream before starting a new one
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Release immediately — we only needed this to trigger the permission grant
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    } catch {
      alert('Please allow microphone access')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Please use Chrome'); return }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onstart = () => setAvatarStatus('listening')
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      recognition.stop()
      await handleUserMessage(transcript)
    }
    recognition.onerror = () => setAvatarStatus('idle')
    recognition.onend = () => setAvatarStatus(prev => prev === 'listening' ? 'idle' : prev)
    recognition.start()
  }

  // ── AUDIO MUTE ──
  const toggleAudioMute = () => {
    const newVal = !isAudioMuted
    isAudioMutedRef.current = newVal
    setIsAudioMuted(newVal)
    if (newVal) {
      window.speechSynthesis.cancel()
      setAvatarStatus('idle')
    }
  }

  // ── VISION FLOW ──
  useEffect(() => {
    const landmarkData = localStorage.getItem('visionLandmark')
    if (!landmarkData) return
    localStorage.removeItem('visionLandmark')
    try {
      const { name, location } = JSON.parse(landmarkData)
      pendingVisionRef.current = `I just detected ${name} in ${location}. Tell me about it!`
    } catch (e) { console.error(e) }
  }, [])

  // ── AVATAR CLASS ──
  const getAvatarClass = () => {
    if (avatarStatus === 'speaking') return 'border-speaking'
    if (avatarStatus === 'listening') return 'border-listening'
    if (avatarStatus === 'thinking') return 'border-thinking'
    return 'border-idle'
  }

  const lastAIMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content

  return (
    <div className="flex flex-col md:flex-row h-full overflow-auto p-4 gap-4">

      {/* LEFT — Avatar */}
      <div className="flex flex-col items-center justify-start md:justify-center gap-3 flex-shrink-0">

        <div className={getAvatarClass()} style={{ position: 'relative', borderRadius: '24px', height: 'min(60vw, 560px)', maxHeight: '560px', minHeight: '280px', aspectRatio: '3/4', width: 'auto', borderWidth: '4px', borderColor: avatarStatus === 'speaking' ? '#ef4444' : avatarStatus === 'listening' ? '#10b981' : avatarStatus === 'thinking' ? '#f59e0b' : '#d1d5db', borderStyle: 'solid', transition: 'border-color 0.3s ease' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#f0f9ff' }}>
            <img src="/atlas-avatar.png" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} alt="Atlas" />
          </div>

          {/* Status pill */}
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'white', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: avatarStatus === 'idle' ? '#22c55e' : avatarStatus === 'listening' ? '#10b981' : avatarStatus === 'thinking' ? '#f59e0b' : '#0ea5e9', display: 'inline-block' }} />
            {avatarStatus === 'idle' ? 'Active' : avatarStatus === 'listening' ? 'Listening...' : avatarStatus === 'thinking' ? 'Thinking...' : 'Speaking...'}
          </div>

          {/* Decorative dots */}
          <div style={{ position: 'absolute', top: '14px', left: '14px', width: '10px', height: '10px', borderRadius: '50%', background: '#7dd3fc', opacity: 0.9 }} />
          <div style={{ position: 'absolute', top: '60px', right: '10px', width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24', opacity: 0.85 }} />
          <div style={{ position: 'absolute', bottom: '80px', left: '10px', width: '9px', height: '9px', borderRadius: '50%', background: '#86efac', opacity: 0.85 }} />

          {/* Wave bars when speaking */}
          {avatarStatus === 'speaking' && (
            <div style={{ position: 'absolute', bottom: '52px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {[0, 0.1, 0.2, 0.15, 0.05, 0.2, 0.1, 0, 0.15, 0.05].map((delay, i) => (
                <div key={i} style={{ width: '3px', background: 'white', borderRadius: '3px', opacity: 0.9, animation: `wave-bars 0.5s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          )}

          {/* Pulse rings when listening */}
          {avatarStatus === 'listening' && (
            <>
              <div style={{ position: 'absolute', inset: '-8px', borderRadius: '28px', border: '2px solid rgba(16,185,129,0.4)', animation: 'pulse-ring 1.2s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: '-16px', borderRadius: '32px', border: '2px solid rgba(16,185,129,0.2)', animation: 'pulse-ring 1.2s ease-out 0.3s infinite' }} />
            </>
          )}
        </div>

        {/* Vision pending banner */}
        {pendingVisionRef.current && (
          <div style={{
            background: '#fef3c7', border: '1px solid #fbbf24',
            borderRadius: '10px', padding: '8px 14px',
            fontSize: '12px', color: '#92400e', textAlign: 'center',
            marginBottom: '8px'
          }}>
            🏛️ Landmark detected — tap <strong>Hold to Speak</strong> to hear about it
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onMouseDown={(e) => { e.preventDefault(); startListening() }}
            onMouseUp={() => { if (recognitionRef.current) try { recognitionRef.current.stop() } catch {} }}
            onMouseLeave={() => { if (recognitionRef.current) try { recognitionRef.current.stop() } catch {} }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); startListening() }}
            onTouchEnd={(e) => { e.preventDefault(); if (recognitionRef.current) try { recognitionRef.current.stop() } catch {} }}
            onTouchCancel={(e) => { e.preventDefault(); if (recognitionRef.current) try { recognitionRef.current.stop() } catch {} }}
            onContextMenu={(e) => e.preventDefault()}
            disabled={avatarStatus === 'speaking'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '10px 22px', borderRadius: '12px', border: 'none',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'white',
              background: avatarStatus === 'listening'
                ? 'linear-gradient(135deg,#10b981,#06b6d4)'
                : 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
              boxShadow: '0 3px 10px rgba(6,182,212,0.3)',
              opacity: avatarStatus === 'speaking' ? 0.5 : 1,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'none',
            } as React.CSSProperties}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
            {avatarStatus === 'listening' ? 'Listening...' : avatarStatus === 'speaking' ? 'Speaking...' : 'Hold to Speak'}
          </button>

          <button
            onClick={toggleAudioMute}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '10px 20px', borderRadius: '12px',
              border: isAudioMuted ? '2px solid #ef4444' : '2px solid #06b6d4',
              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              color: isAudioMuted ? '#ef4444' : '#0e7490',
              background: 'white'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isAudioMuted
                ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></>
              }
            </svg>
            {isAudioMuted ? 'Audio Off' : 'Audio On'}
          </button>
        </div>
      </div>

      {/* RIGHT — Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', minWidth: 0, overflowY: 'auto', paddingBottom: '80px' }}>

        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '5px' }}>Your Personal Tour Guide</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0e7490' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
            {avatarStatus === 'idle' ? 'Ready to help' : avatarStatus === 'listening' ? 'Listening...' : avatarStatus === 'thinking' ? 'Thinking...' : 'Speaking...'}
          </div>
        </div>

        {/* Response box */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid #bae6fd', borderRadius: '14px', padding: '13px 15px' }}>
          <div style={{ fontSize: '10px', color: '#0ea5e9', marginBottom: '6px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Atlas</div>
          {avatarStatus === 'speaking' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px' }}>
              {[0, 0.1, 0.3, 0.2, 0.4, 0.15, 0.35, 0.05, 0.25, 0.1].map((delay, i) => (
                <div key={i} style={{ width: '3px', background: 'linear-gradient(to top,#0ea5e9,#06b6d4)', borderRadius: '3px', animation: `wave-bars 0.5s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          )}
          <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', lineHeight: 1.65 }}>
            {lastAIMessage || "Hi! I'm Atlas, your personal AI travel guide. Tap the button and start speaking!"}
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Suggestions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={async (e) => {
                  e.preventDefault()
                  try {
                    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
                    if (AudioContextClass) {
                      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                        audioCtxRef.current = new AudioContextClass()
                      }
                      await audioCtxRef.current.resume()
                    }
                  } catch {}
                  handleUserMessage(s)
                }}
                onTouchStart={async (e) => {
                  e.preventDefault()
                  try {
                    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
                    if (AudioContextClass) {
                      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                        audioCtxRef.current = new AudioContextClass()
                      }
                      await audioCtxRef.current.resume()
                    }
                  } catch {}
                  handleUserMessage(s)
                }}
                disabled={avatarStatus !== 'idle'}
                style={{
                  padding: '8px 14px', borderRadius: '20px',
                  border: '1.5px solid #bae6fd', background: 'white',
                  fontSize: '12px', cursor: 'pointer', color: '#0369a1', fontWeight: 500,
                  opacity: avatarStatus !== 'idle' ? 0.5 : 1
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
