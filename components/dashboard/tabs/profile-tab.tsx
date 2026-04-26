'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

const voices = [
  { id: 'nova', label: 'Nova', desc: 'Warm & friendly', gender: 'female' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Clear & professional', gender: 'female' },
  { id: 'alloy', label: 'Alloy', desc: 'Neutral & calm', gender: 'female' },
  { id: 'echo', label: 'Echo', desc: 'Deep & confident', gender: 'male' },
  { id: 'onyx', label: 'Onyx', desc: 'Rich & authoritative', gender: 'male' },
  { id: 'fable', label: 'Fable', desc: 'Expressive & lively', gender: 'male' },
]

const avatars = [
  { id: 'avatar1', label: 'Luna', gender: 'female', img: '/avatars/avatar-luna.png' },
  { id: 'avatar2', label: 'Nova', gender: 'female', img: '/avatars/avatar-nova.png' },
  { id: 'avatar3', label: 'Sage', gender: 'female', img: '/avatars/avatar-sage.png' },
  { id: 'avatar4', label: 'Blaze', gender: 'male', img: '/avatars/avatar-blaze.png' },
  { id: 'avatar5', label: 'Orion', gender: 'male', img: '/avatars/avatar-orion.png' },
  { id: 'avatar6', label: 'Rex', gender: 'male', img: '/avatars/avatar-rex.png' },
]

export function ProfileTab() {
  const { user, logout } = useAuth()
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1')
  const [selectedVoice, setSelectedVoice] = useState('nova')
  const [responseLength, setResponseLength] = useState<'short' | 'detailed'>('short')
  const [stats, setStats] = useState({ voice: 0, chat: 0, landmarks: 0 })
  const [memberSince, setMemberSince] = useState('')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)

  const selectedAvatarGender = avatars.find(a => a.id === selectedAvatar)?.gender || 'female'
  const filteredVoices = voices.filter(v => v.gender === selectedAvatarGender)

  useEffect(() => {
    if (!user) return
    loadStats()
    loadProfile()
  }, [user])

  const loadStats = async () => {
    try {
      const { db } = await import('@/firebase.config')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const uid = (user as any).uid

      const [chatDocs, avatarDocs, visionDocs] = await Promise.all([
        getDocs(query(collection(db, 'chatHistory'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'avatarHistory'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'visionHistory'), where('userId', '==', uid))),
      ])

      setStats({
        chat: chatDocs.size,
        voice: avatarDocs.size,
        landmarks: visionDocs.size,
      })

      // Get member since from users collection
      const { doc, getDoc } = await import('firebase/firestore')
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        if (data.createdAt) {
          const date = new Date(data.createdAt)
          setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
        }
      }
    } catch (e) {
      console.error('Stats load error:', e)
    }
  }

  const saveProfile = async (data: { avatar?: string; voice?: string; responseLength?: string }) => {
    try {
      const { db } = await import('@/firebase.config')
      const { doc, setDoc } = await import('firebase/firestore')
      const uid = (user as any).uid
      await setDoc(doc(db, 'userProfiles', uid), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.error('Save profile error:', e)
    }
  }

  const loadProfile = async () => {
    try {
      const { db } = await import('@/firebase.config')
      const { doc, getDoc } = await import('firebase/firestore')
      const uid = (user as any).uid
      const snap = await getDoc(doc(db, 'userProfiles', uid))
      if (snap.exists()) {
        const data = snap.data()
        if (data.avatar) setSelectedAvatar(data.avatar)
        if (data.voice) setSelectedVoice(data.voice)
        if (data.responseLength) setResponseLength(data.responseLength)
      }
    } catch (e) {
      console.error('Load profile error:', e)
    }
  }

  const previewVoice = async (voiceId: string) => {
    if (playingVoice) return
    setPlayingVoice(voiceId)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Hi, I'm Atlas, your personal travel guide!`, voice: voiceId })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { setPlayingVoice(null); URL.revokeObjectURL(url) }
      audio.onerror = () => { setPlayingVoice(null) }
      await audio.play()
    } catch {
      setPlayingVoice(null)
    }
  }

  const nameInitial = ((user as any)?.displayName || (user as any)?.email || 'U').charAt(0).toUpperCase()

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box', width: '100%' }}>

        {/* Profile Header */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 500, color: '#0c4a6e' }}>
                {nameInitial}
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(user as any)?.displayName || 'Traveler'}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ cursor: 'pointer', flexShrink: 0 }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                {(user as any)?.email || ''}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                Member since {memberSince || 'January 2024'}
              </div>
            </div>
            <button style={{ padding: '8px 16px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', fontSize: '12px', color: 'var(--color-text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Change password
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { num: stats.voice, label: 'Voice chats' },
              { num: stats.chat, label: 'Text chats' },
              { num: stats.landmarks, label: 'Landmarks' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--color-background-secondary)', borderRadius: '12px', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.num}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two column layout on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '12px' }}>

          {/* Avatar Selection */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Choose your Atlas avatar</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {avatars.map(avatar => (
              <div
                key={avatar.id}
                onClick={() => {
                  setSelectedAvatar(avatar.id)
                  const newGender = avatars.find(a => a.id === avatar.id)?.gender || 'female'
                  const firstVoice = voices.find(v => v.gender === newGender)
                  if (firstVoice) {
                    setSelectedVoice(firstVoice.id)
                    saveProfile({ avatar: avatar.id, voice: firstVoice.id })
                  } else {
                    saveProfile({ avatar: avatar.id })
                  }
                }}
                style={{ width: '56px', height: '56px', borderRadius: '12px', border: `2px solid ${selectedAvatar === avatar.id ? '#0ea5e9' : 'var(--color-border-tertiary)'}`, overflow: 'hidden', cursor: 'pointer', position: 'relative', flexShrink: 0 }}
              >
                <img
                  src={avatar.img}
                  alt={avatar.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.35)', padding: '2px 0', textAlign: 'center' }}>
                  <span style={{ fontSize: '8px', color: 'white', fontWeight: 500 }}>{avatar.label}</span>
                </div>
                {selectedAvatar === avatar.id && (
                  <div style={{ position: 'absolute', top: '3px', right: '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
            Luna, Nova, Sage = female · Blaze, Orion, Rex = male
          </div>
          </div>

          {/* Voice Selection */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Atlas voice</div>
            {filteredVoices.map((voice, i) => (
            <div key={voice.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < filteredVoices.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => previewVoice(voice.id)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '0.5px solid var(--color-border-secondary)', background: playingVoice === voice.id ? '#0ea5e9' : 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill={playingVoice === voice.id ? 'white' : 'var(--color-text-secondary)'}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{voice.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{voice.desc}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: voice.gender === 'female' ? '#fce7f3' : '#e0f2fe', color: voice.gender === 'female' ? '#9d174d' : '#0c4a6e' }}>
                  {voice.gender === 'female' ? 'Female' : 'Male'}
                </span>
                {selectedVoice === voice.id && (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                {selectedVoice !== voice.id && (
                  <div
                    onClick={() => {
                      setSelectedVoice(voice.id)
                      saveProfile({ voice: voice.id })
                    }}
                    style={{ width: '16px', height: '16px', borderRadius: '50%', border: '0.5px solid var(--color-border-secondary)', cursor: 'pointer', flexShrink: 0 }}
                  />
                )}
              </div>
            </div>
          ))}
          <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: '10px', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
            {selectedAvatarGender === 'female' ? 'Showing female voices — select a male avatar to see male voices' : 'Showing male voices — select a female avatar to see female voices'}
          </div>
          </div>

        </div>

        {/* Guide Preferences */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Guide preferences</div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Response length</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>How detailed Atlas responses are</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['short', 'detailed'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setResponseLength(opt)
                    saveProfile({ responseLength: opt })
                  }}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: '0.5px solid var(--color-border-secondary)', fontSize: '12px', cursor: 'pointer', background: responseLength === opt ? '#0ea5e9' : 'var(--color-background-primary)', color: responseLength === opt ? 'white' : 'var(--color-text-secondary)', fontWeight: responseLength === opt ? 500 : 400 }}
                >
                  {opt === 'short' ? 'Short & snappy' : 'Detailed'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Language</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>English only for now</div>
            </div>
            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>Coming soon</span>
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px' }}>
          <button
            onClick={logout}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '0.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}
