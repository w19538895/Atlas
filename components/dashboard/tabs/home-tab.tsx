'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocation } from '@/lib/LocationContext'
import { auth, db } from "@/firebase.config";
import { setDoc, doc } from "firebase/firestore";

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

export function HomeTab() {
  const { locationName } = useLocation()
  const currentUser = auth.currentUser
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions)
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking' | 'connecting'>('connecting')
  const [isConnected, setIsConnected] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const sessionId = useRef(Date.now().toString())
  const audioRef = useRef<HTMLAudioElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const micTrackRef = useRef<MediaStreamTrack | null>(null)

  const generateSuggestions = async (chatMessages: Message[]) => {
    try {
      const lastMessages = chatMessages.slice(-4);
      
      if (lastMessages.length === 0) {
        setSuggestions(defaultSuggestions);
        return;
      }

      const conversationForSuggestions = lastMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a travel assistant. Based on the conversation so far generate exactly 3 short follow up question suggestions the user might want to ask next. Each suggestion must be under 8 words. Return ONLY a valid JSON array of 3 strings like this: [\"suggestion 1\", \"suggestion 2\", \"suggestion 3\"] — nothing else, no explanation, no markdown",
            },
            {
              role: "user",
              content: conversationForSuggestions,
            },
          ],
        }),
      });

      const data = await response.json();
      const responseText = data.message?.trim() || "";
      
      try {
        const parsedSuggestions = JSON.parse(responseText);
        if (Array.isArray(parsedSuggestions) && parsedSuggestions.length === 3 && parsedSuggestions.every((s: any) => typeof s === "string")) {
          setSuggestions(parsedSuggestions);
        }
      } catch (parseError) {
        console.warn("Failed to parse suggestions JSON", parseError);
      }
    } catch (error) {
      console.error("Suggestion generation error:", error);
    }
  };

  const saveAvatarHistory = async (chatMessages: Message[]) => {
    try {
      if (!currentUser?.uid) {
        console.warn("User not authenticated, skipping avatar history save");
        return;
      }

      if (chatMessages.length === 0) return;

      const lastUserMessage = [...chatMessages].reverse().find(msg => msg.role === "user")?.content || "";
      const lastAIResponse = [...chatMessages].reverse().find(msg => msg.role === "assistant")?.content || "";

      const avatarData = {
        userId: currentUser.uid,
        messages: chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
        })),
        lastMessage: lastUserMessage,
        aiLastResponse: lastAIResponse,
        location: locationName || null,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "avatarHistory", sessionId.current), avatarData);
      console.log("Avatar history saved successfully");
    } catch (error) {
      console.error("Error saving avatar history to Firestore:", error);
    }
  };

  const connect = async () => {
    try {
      setAvatarStatus('connecting')
      const tokenRes = await fetch('/api/realtime', { method: 'POST' })
      const session = await tokenRes.json()
      const ephemeralKey = session.client_secret.value

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      if (audioRef.current) {
        audioRef.current.autoplay = true
        pc.ontrack = (e) => {
          if (audioRef.current) audioRef.current.srcObject = e.streams[0]
        }
      }

      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      micTrackRef.current = ms.getTracks()[0]
      pc.addTrack(ms.getTracks()[0])

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data)
        if (event.type === 'input_audio_buffer.speech_started') setAvatarStatus('listening')
        if (event.type === 'response.created') setAvatarStatus('thinking')
        if (event.type === 'response.audio.delta') setAvatarStatus('speaking')
        if (event.type === 'response.done') {
          setAvatarStatus('idle')
          const aiText = event.response?.output?.[0]?.content?.[0]?.transcript || ''
          if (aiText) {
            const assistantMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: aiText,
              timestamp: new Date()
            }
            setMessages(prev => {
              const updated = [...prev, assistantMessage]
              setTimeout(() => {
                generateSuggestions(updated)
                saveAvatarHistory(updated)
              }, 0)
              return updated
            })
          }
        }
        if (event.type === 'conversation.item.created' && event.item?.role === 'user') {
          const userText = event.item?.content?.[0]?.transcript || ''
          if (userText) {
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: userText,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, userMessage])
          }
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        }
      })
      const answer = { type: 'answer' as RTCSdpType, sdp: await sdpRes.text() }
      await pc.setRemoteDescription(answer)

      setIsConnected(true)
      setAvatarStatus('idle')
    } catch (err) {
      console.error('Realtime connect error:', err)
      setAvatarStatus('idle')
    }
  }

  useEffect(() => {
    connect()
    return () => { pcRef.current?.close() }
  }, [])

  useEffect(() => {
    if (!isConnected || !dcRef.current || dcRef.current.readyState !== 'open') return
    dcRef.current.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: `You are Atlas, an enthusiastic and friendly AI travel guide.${locationName ? ` The user is currently near ${locationName}. Use this to give accurate local recommendations.` : ''} Keep responses conversational and under 3 sentences. Always end with a question.`
      }
    }))
  }, [isConnected, locationName])

  const handleSuggestion = (text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    dcRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }))
    dcRef.current.send(JSON.stringify({ type: 'response.create' }))
  }

  const toggleMicMute = () => {
    if (micTrackRef.current) {
      micTrackRef.current.enabled = !micTrackRef.current.enabled
      setIsMicMuted(!isMicMuted)
    }
  }

  const toggleAudioMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsAudioMuted(!isAudioMuted)
    }
  }

  useEffect(() => {
    if (!isConnected || !dcRef.current) return
    const landmarkData = localStorage.getItem('visionLandmark')
    if (!landmarkData) return
    localStorage.removeItem('visionLandmark')
    try {
      const { name, location } = JSON.parse(landmarkData)
      const text = `I just detected ${name} in ${location}. Tell me about it!`
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      dcRef.current!.send(JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] }
      }))
      dcRef.current!.send(JSON.stringify({ type: 'response.create' }))
    } catch (e) {
      console.error('Vision landmark error:', e)
    }
  }, [isConnected])

  return (
    <div className="flex flex-col h-full items-center px-4 py-6 gap-4">
      <audio ref={audioRef} autoPlay playsInline />

      {/* Avatar card */}
      <div className={`relative rounded-2xl overflow-hidden shadow-xl border-4 w-64 h-64 
        ${avatarStatus === 'speaking' ? 'border-red-500' : ''}
        ${avatarStatus === 'listening' ? 'border-blue-500' : ''}
        ${avatarStatus === 'thinking' ? 'border-yellow-500' : ''}
        ${avatarStatus === 'idle' || avatarStatus === 'connecting' ? 'border-gray-300' : ''}
      `}>
        <img
          src="/atlas-avatar.png"
          className="w-full h-full object-cover object-top"
          alt="Atlas Avatar"
        />
        {/* Status pill */}
        <div className="absolute bottom-2 right-2 bg-white rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow">
          <span className={`w-2 h-2 rounded-full ${avatarStatus === 'idle' ? 'bg-green-500' : avatarStatus === 'connecting' ? 'bg-yellow-400' : 'bg-blue-500'}`} />
          {avatarStatus === 'connecting' ? 'Connecting...' : avatarStatus === 'listening' ? 'Listening...' : avatarStatus === 'speaking' ? 'Speaking...' : avatarStatus === 'thinking' ? 'Thinking...' : 'Active'}
        </div>
      </div>

      {/* Mute buttons */}
      <div className="flex gap-3">
        <button
          onClick={toggleMicMute}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${isMicMuted ? 'bg-red-100 border-red-300 text-red-600' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
        >
          {isMicMuted ? '🎤 Mic Off' : '🎤 Mic On'}
        </button>
        <button
          onClick={toggleAudioMute}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${isAudioMuted ? 'bg-red-100 border-red-300 text-red-600' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
        >
          {isAudioMuted ? '🔇 Sound Off' : '🔊 Sound On'}
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center w-full max-w-md">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(s)}
            disabled={!isConnected || avatarStatus !== 'idle'}
            className="px-3 py-2 rounded-full text-sm bg-white border border-gray-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
