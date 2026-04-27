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
  { id: 'avatar1', label: 'Luna', gender: 'female', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-luna.png?alt=media&token=bb7c3ae4-e8cb-4d78-8cb9-e03beb5966e5' },
  { id: 'avatar2', label: 'Nova', gender: 'female', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-nova.png?alt=media&token=3c60b27f-62eb-4aa9-a442-86b6ce28957f' },
  { id: 'avatar3', label: 'Sage', gender: 'female', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-sage.png?alt=media&token=6ea53e47-6fda-4f6e-a863-f5f928399fe3' },
  { id: 'avatar4', label: 'Blaze', gender: 'male', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-blaze.png?alt=media&token=afbe5f15-9276-4b50-a295-b3c25300175d' },
  { id: 'avatar5', label: 'Orion', gender: 'male', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-orion.png?alt=media&token=79c55666-f3a9-4d65-a8eb-3acad58f9bd3' },
  { id: 'avatar6', label: 'Rex', gender: 'male', img: 'https://firebasestorage.googleapis.com/v0/b/atlas-f90ee.firebasestorage.app/o/avatars%2Favatar-rex.png?alt=media&token=ff7bbacc-0d05-4853-b36f-e1eb4d1240ea' },
]

export function ProfileTab() {
  const { user, logout } = useAuth()
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1')
  const [selectedVoice, setSelectedVoice] = useState('nova')
  const [responseLength, setResponseLength] = useState<'short' | 'detailed'>('short')
  const [stats, setStats] = useState({ voice: 0, chat: 0, landmarks: 0 })
  const [memberSince, setMemberSince] = useState('')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [showEmailPw, setShowEmailPw] = useState(false)

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

  const saveName = async () => {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const { updateProfile } = await import('firebase/auth')
      const { auth } = await import('@/firebase.config')
      const { db } = await import('@/firebase.config')
      const { doc, setDoc } = await import('firebase/firestore')
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName.trim() })
        await setDoc(doc(db, 'users', (user as any).uid), {
          name: newName.trim(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
      setEditingName(false)
    } catch (e) {
      console.error('Save name error:', e)
    } finally {
      setSavingName(false)
    }
  }

  const savePassword = async () => {
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters'); return }
    if (!currentPassword) { setPasswordError('Please enter your current password'); return }
    setSavingPassword(true)
    setPasswordError('')
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth')
      const { auth } = await import('@/firebase.config')
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
        await reauthenticateWithCredential(auth.currentUser, credential)
        await updatePassword(auth.currentUser, newPassword)
      }
      setChangingPassword(false)
      setNewPassword('')
      setCurrentPassword('')
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setPasswordError('Current password is incorrect')
      else if (e.code === 'auth/requires-recent-login') setPasswordError('Please sign out and sign back in first')
      else setPasswordError('Failed to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const saveEmail = async () => {
    if (!newEmail.trim() || !emailPassword) { setEmailError('Please fill in all fields'); return }
    setSavingEmail(true)
    setEmailError('')
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updateEmail } = await import('firebase/auth')
      const { auth } = await import('@/firebase.config')
      const { db } = await import('@/firebase.config')
      const { doc, setDoc } = await import('firebase/firestore')
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, emailPassword)
        await reauthenticateWithCredential(auth.currentUser, credential)
        await updateEmail(auth.currentUser, newEmail.trim())
        await setDoc(doc(db, 'users', (user as any).uid), {
          email: newEmail.trim(),
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
      setEditingEmail(false)
      setNewEmail('')
      setEmailPassword('')
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setEmailError('Incorrect password')
      else if (e.code === 'auth/invalid-email') setEmailError('Invalid email address')
      else if (e.code === 'auth/email-already-in-use') setEmailError('Email already in use')
      else if (e.code === 'auth/requires-recent-login') setEmailError('Please sign out and sign back in first')
      else setEmailError('Failed to update email')
    } finally {
      setSavingEmail(false)
    }
  }

  const uploadProfilePic = async (file: File) => {
    if (!file) return
    setUploadingPic(true)
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { db } = await import('@/firebase.config')
      const { storage } = await import('@/firebase.config')
      const { doc, setDoc } = await import('firebase/firestore')
      const storageRef = ref(storage, `profilePics/${(user as any).uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setProfilePicUrl(url)
      await setDoc(doc(db, 'userProfiles', (user as any).uid), {
        profilePicUrl: url,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    } catch (e) {
      console.error('Upload error:', e)
    } finally {
      setUploadingPic(false)
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
        if (data.profilePicUrl) setProfilePicUrl(data.profilePicUrl)
      } else {
        setSelectedAvatar('avatar1')
        setSelectedVoice('nova')
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
    <>
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '140px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px', boxSizing: 'border-box', width: '100%' }}>

        {/* Profile Header */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 500, color: '#0c4a6e' }}>
                  {nameInitial}
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: uploadingPic ? '#9ca3af' : '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadProfilePic(f) }} />
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </label>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(user as any)?.displayName || 'Traveler'}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setNewName((user as any)?.displayName || ''); setEditingName(true) }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(user as any)?.email || ''}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setNewEmail((user as any)?.email || ''); setEditingEmail(true) }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                Member since {memberSince || 'January 2024'}
              </div>
            </div>
            <button onClick={() => setChangingPassword(true)} style={{ padding: '8px 18px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', fontSize: '12px', color: 'var(--color-text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
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

          </div>

          {/* Voice Selection */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>Atlas voice</div>
            {filteredVoices.map((voice, i) => (
            <div key={voice.id} onClick={() => { setSelectedVoice(voice.id); saveProfile({ voice: voice.id }) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer', borderBottom: i < filteredVoices.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
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
                    style={{ width: '16px', height: '16px', borderRadius: '50%', border: '0.5px solid var(--color-border-secondary)', cursor: 'pointer', flexShrink: 0 }}
                  />
                )}
              </div>
            </div>
          ))}
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

    {/* Edit Name Modal - OUTSIDE scroll container */}
    {editingName && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={() => setEditingName(false)}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Edit display name</div>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', fontSize: '13px', color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setEditingName(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button onClick={saveName} disabled={savingName} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#0ea5e9', fontSize: '13px', cursor: 'pointer', color: 'white', fontWeight: 500 }}>
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Change Password Modal - OUTSIDE scroll container */}
    {changingPassword && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={() => setChangingPassword(false)}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '16px' }}>Change password</div>

          {/* Current password with peek */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showCurrentPw ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', fontSize: '13px', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', outline: 'none' }}
            />
            <button onClick={() => setShowCurrentPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '11px' }}>
              {showCurrentPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* New password with peek */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showNewPw ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', fontSize: '13px', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', outline: 'none' }}
            />
            <button onClick={() => setShowNewPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '11px' }}>
              {showNewPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {passwordError && <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '8px' }}>{passwordError}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setChangingPassword(false); setPasswordError(''); setNewPassword(''); setCurrentPassword(''); setShowCurrentPw(false); setShowNewPw(false) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '0.5px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', cursor: 'pointer', color: '#6b7280' }}>
              Cancel
            </button>
            <button onClick={savePassword} disabled={savingPassword} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#0ea5e9', fontSize: '13px', cursor: 'pointer', color: 'white', fontWeight: 500 }}>
              {savingPassword ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Change Email Modal - OUTSIDE scroll container */}
    {editingEmail && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={() => setEditingEmail(false)}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Change email</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Enter your new email and current password to confirm</div>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="New email address"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', fontSize: '13px', color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)', marginBottom: '8px', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <input
              type={showEmailPw ? 'text' : 'password'}
              value={emailPassword}
              onChange={e => setEmailPassword(e.target.value)}
              placeholder="Current password to confirm"
              style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '10px', border: '0.5px solid #e5e7eb', fontSize: '13px', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', outline: 'none' }}
            />
            <button onClick={() => setShowEmailPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '11px' }}>
              {showEmailPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {emailError && <div style={{ fontSize: '11px', color: '#dc2626', marginBottom: '8px' }}>{emailError}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setEditingEmail(false); setEmailError(''); setNewEmail(''); setEmailPassword(''); setShowEmailPw(false) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button onClick={saveEmail} disabled={savingEmail} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#0ea5e9', fontSize: '13px', cursor: 'pointer', color: 'white', fontWeight: 500 }}>
              {savingEmail ? 'Updating...' : 'Update email'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
