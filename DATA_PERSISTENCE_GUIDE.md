# Atlas Data Persistence Guide

Complete overview of how Atlas saves and manages voice input, chat conversations, landmark detections, and avatar interactions using Firebase and localStorage.

---

## 🔧 Firebase Configuration

**File:** `firebase.config.ts`

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtulxteL1bmtYm3DS45m1icEZPPbN-80Y",
  authDomain: "atlas-f90ee.firebaseapp.com",
  projectId: "atlas-f90ee",
  storageBucket: "atlas-f90ee.firebasestorage.app",
  messagingSenderId: "503688631875",
  appId: "1:503688631875:web:fc5b3d3195f3066fa6e6f6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Collections Used:**
- `users` - User profile data (name, email, createdAt)
- `chatHistory` - Chat tab conversations (indexed by sessionId)
- `avatarHistory` - Avatar conversations (indexed by sessionId)
- `visionHistory` - Landmark detection history

---

## 👤 User Authentication & Profile

**File:** `lib/auth-context.tsx`

### User Signup Flow
```typescript
const signup = async (email: string, password: string, name: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Save user profile to Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name,
    email,
    createdAt: new Date().toISOString(),
  });
};
```

**Firestore `users` Collection Schema:**
```json
{
  "uid": {
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-04-23T12:00:00.000Z"
  }
}
```

### User Login
```typescript
const login = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};
```

### User Logout
```typescript
const logout = async () => {
  await signOut(auth);
};
```

---

## 🎙️ Voice Input & Chat Conversations (Avatar Tab)

**File:** `components/dashboard/tabs/home-tab.tsx`

### Voice Input Flow

1. **Microphone Initialization**
   - On component mount, requests microphone permission
   - Initializes AudioContext for TTS playback
   - Stores state in `audioUnlockedRef`

```typescript
useEffect(() => {
  navigator.mediaDevices?.getUserMedia({ audio: true })
    .then(stream => {
      stream.getTracks().forEach(t => t.stop())
      audioUnlockedRef.current = true
      // Initialize AudioContext
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass()
        }
        audioCtxRef.current.resume()
      }
    })
    .catch(() => {})
}, [])
```

2. **Speech Recognition (Voice Capture)**
   - Uses Web Speech API
   - Captures user speech
   - Converts to text (transcript)
   - Sends to OpenAI for chat response

```typescript
const startListening = async () => {
  if (avatarStatus === 'speaking') return
  window.speechSynthesis.cancel()

  // AudioContext unlock (every tap)
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass()
      }
      await audioCtxRef.current.resume()
      const buffer = audioCtxRef.current.createBuffer(1, 1, 22050)
      const src = audioCtxRef.current.createBufferSource()
      src.buffer = buffer
      src.connect(audioCtxRef.current.destination)
      src.start(0)
    }
  } catch {}

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognitionRef.current = recognition
  recognition.continuous = false  // Single utterance, auto-stops
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
```

### Chat Message Handling

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const handleUserMessage = async (userText: string) => {
  setAvatarStatus('thinking')
  
  // Create new message
  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: userText,
    timestamp: new Date()
  }
  const updated = [...messagesRef.current, userMsg]
  setMessages(updated)
  
  try {
    // Send to OpenAI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updated.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })
    
    const data = await response.json()
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.message,
      timestamp: new Date()
    }
    
    const final = [...updated, aiMsg]
    setMessages(final)
    
    // Play audio response
    await speakText(data.message)
    
    // Save to Firestore & generate suggestions
    setTimeout(() => { 
      generateSuggestions(final)
      saveAvatarHistory(final)
    }, 0)
  } catch (error) {
    console.error('Chat error:', error)
    setAvatarStatus('idle')
  }
}
```

### Text-to-Speech (TTS)

**Files:** `components/dashboard/tabs/home-tab.tsx`, `app/api/tts/route.ts`

```typescript
const speakText = async (text: string) => {
  try {
    // Fetch audio from OpenAI TTS API
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Decode and play using WebAudio API
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = (window as any).__atlasAudioCtx || new AudioContextClass()
        ;(window as any).__atlasAudioCtx = null
      }
      
      const decodedData = await audioCtxRef.current.decodeAudioData(arrayBuffer)
      const source = audioCtxRef.current.createBufferSource()
      source.buffer = decodedData
      source.connect(audioCtxRef.current.destination)
      
      setAvatarStatus('speaking')
      source.onended = () => setAvatarStatus('idle')
      source.start(0)
    }
  } catch (error) {
    console.error('TTS error:', error)
    setAvatarStatus('idle')
  }
}
```

### Save Avatar Chat History to Firebase

**Collection:** `avatarHistory`
**Key:** `sessionId` (timestamp-based, unique per session)

```typescript
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
```

**Firestore `avatarHistory` Schema:**
```json
{
  "sessionId_1234567890": {
    "userId": "uid_abc123",
    "messages": [
      {
        "role": "user",
        "content": "What are the best restaurants nearby?",
        "timestamp": "2026-04-23T12:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "The best restaurants near you are...",
        "timestamp": "2026-04-23T12:00:05.000Z"
      }
    ],
    "lastMessage": "What are the best restaurants nearby?",
    "aiLastResponse": "The best restaurants near you are...",
    "location": "San Francisco, CA",
    "timestamp": "2026-04-23T12:00:05.000Z",
    "updatedAt": "2026-04-23T12:00:05.000Z"
  }
}
```

---

## � Chat Tab History

**File:** `components/dashboard/tabs/chat-tab.tsx`

### Chat Flow

1. **Initialize Session**
   - Creates unique `sessionId` on component mount (timestamp-based)
   - Checks localStorage for `visionLandmark` data from Vision tab
   - If landmark data present, generates welcome message about landmark

2. **Landmark Detection Flow** (from Vision tab)
```typescript
const checkForLandmark = () => {
  const landmarkData = localStorage.getItem('visionLandmark')
  if (landmarkData && !hasProcessedLandmark) {
    try {
      const { name, location } = JSON.parse(landmarkData)
      localStorage.removeItem('visionLandmark')  // Delete after reading
      
      setCurrentTopic(name)
      setHasProcessedLandmark(true)
      
      // Generate welcome message from OpenAI about the landmark
      generateLandmarkWelcome(name, location)
    } catch (error) {
      console.error("Error parsing landmark data:", error)
    }
  }
}
```

3. **Send Message & Get Response**
```typescript
const sendMessage = async (content: string) => {
  if (!content.trim()) return

  // Add user message to state
  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: content.trim(),
    timestamp: new Date(),
    context: landmarkContext ? { type: "landmark", name: landmarkContext.name } : undefined,
  }

  setMessages((prev) => [...prev, userMessage])
  setInput("")
  setIsTyping(true)

  try {
    // Send to OpenAI with conversation history
    const response = await sendChatMessage(
      content.trim(),
      conversationHistory,  // Previous messages
      locationName,         // User's location
      latitude,
      longitude
    )

    // Add AI response to state
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage, assistantMessage]
    setMessages(updatedMessages)
    
    // Save to Firebase, detect topic, and generate suggestions
    setTimeout(() => {
      saveChatToFirestore(updatedMessages)
      detectTopic(updatedMessages)
      generateSuggestions(updatedMessages)
    }, 0)
  } catch (err) {
    setError("Failed to get response. Please try again.")
  } finally {
    setIsTyping(false)
  }
}
```

### Save Chat History to Firebase

**Collection:** `chatHistory`
**Key:** `sessionId` (unique per chat session)

```typescript
const saveChatToFirestore = async (chatMessages: Message[]) => {
  if (!currentUser || chatMessages.length === 0) return

  try {
    const lastUserMessage = [...chatMessages].reverse().find(msg => msg.role === "user")?.content || ""
    const lastAIResponse = [...chatMessages].reverse().find(msg => msg.role === "assistant")?.content || ""

    // Prepare document data
    const chatData = {
      userId: currentUser.uid,
      messages: chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
      })),
      lastMessage: lastUserMessage,
      aiLastResponse: lastAIResponse,
      topic: currentTopic || null,
      location: locationName || null,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to Firestore using sessionId as document ID
    await setDoc(doc(db, "chatHistory", sessionId), chatData)
    
    console.log("Chat history saved successfully")
  } catch (error) {
    console.error("Error saving chat to Firestore:", error)
  }
}
```

**Firestore `chatHistory` Schema:**
```json
{
  "sessionId_1234567890": {
    "userId": "uid_abc123",
    "messages": [
      {
        "role": "user",
        "content": "What are the best restaurants nearby?",
        "timestamp": "2026-04-23T12:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "The best restaurants near you are...",
        "timestamp": "2026-04-23T12:00:05.000Z"
      },
      {
        "role": "user",
        "content": "Can you tell me more about restaurant A?",
        "timestamp": "2026-04-23T12:00:10.000Z"
      },
      {
        "role": "assistant",
        "content": "Restaurant A is known for...",
        "timestamp": "2026-04-23T12:00:15.000Z"
      }
    ],
    "lastMessage": "Can you tell me more about restaurant A?",
    "aiLastResponse": "Restaurant A is known for...",
    "topic": "Eiffel Tower",
    "location": "Paris, France",
    "timestamp": "2026-04-23T12:00:15.000Z",
    "updatedAt": "2026-04-23T12:00:15.000Z"
  }
}
```

### Generate Suggestions

Auto-generated after each AI response for quick replies:

```typescript
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
            content: `Generate exactly 4 short travel follow-up questions under 8 words each. Return ONLY a valid JSON array like this: ["What is the history?","How do I get there?","What should I eat?","Where can I stay?"]. No explanation.`
          },
          { role: 'user', content: conversationForSuggestions }
        ]
      })
    })

    const data = await response.json()
    const parsed = JSON.parse(data.message?.trim() || '[]')
    if (Array.isArray(parsed) && parsed.length === 4) {
      setSuggestions(parsed)
    } else {
      setSuggestions(defaultSuggestions)
    }
  } catch { }
}
```

### Detect Topic

Auto-detects conversation topic:

```typescript
const detectTopic = async (chatMessages: Message[]) => {
  try {
    const lastMessages = chatMessages.slice(-4)
    if (lastMessages.length === 0) { setCurrentTopic(""); return }

    const conversationForTopic = lastMessages
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "Extract the main topic in 2-3 words or return 'Travel' if no specific topic. Return ONLY the topic, nothing else.",
          },
          { role: "user", content: conversationForTopic },
        ],
      }),
    })

    const data = await response.json()
    const topic = data.message?.trim() || ""
    if (topic && topic !== "Travel") {
      setCurrentTopic(topic)
    }
  } catch (error) {
    console.error("Error detecting topic:", error)
  }
}
```

### Clear Chat

Resets conversation and generates new sessionId:

```typescript
const handleClearChat = () => {
  setMessages(initialMessages)
  setCurrentTopic("")
  setSuggestions(defaultSuggestions)
  setLandmarkContext(null)
  setSessionId(Date.now().toString())  // Generate new sessionId for next conversation
}
```

---

## �📸 Vision / Landmark Detection

**File:** `components/dashboard/tabs/vision-tab.tsx`

### Landmark Analysis Flow

1. **Image Upload/Capture**
   - User uploads or captures image via camera
   - Image sent to OpenAI Vision API (GPT-4o)
   - Returns landmark name, location, facts, tips

2. **API Analysis**

```typescript
const handleAnalyzeImage = async (image: string) => {
  setIsAnalyzing(true);
  
  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: image }
          },
          {
            type: "text",
            text: "Analyze this landmark image and provide: name, location, historical facts (3), interesting details (3), and travel tips (2). Format as JSON."
          }
        ]
      }
    ],
    max_tokens: 1000
  };
  
  try {
    const response = await fetch('https://api.openai.com/v1/vision/analyzeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    setAnalysisResult(data);
    
    // Auto-save to Firestore if user is authenticated
    if (currentUser?.uid && data.name && data.location) {
      saveToFirestore(data.name, data.location);
    }
  } catch (error) {
    console.error("Analysis error:", error);
    setAnalysisResult({ error: "Failed to analyze image", name: "", location: "", historicalFacts: [], interestingDetails: [], travelTips: [] });
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Save Landmark to Firebase

**Collection:** `visionHistory`

```typescript
const saveToFirestore = async (landmarkName: string, location: string) => {
  try {
    if (!currentUser?.uid) return;

    await addDoc(collection(db, "visionHistory"), {
      userId: currentUser.uid,
      landmarkName,
      location,
      timestamp: new Date().toISOString(),
    });

    console.log("Landmark saved to history");
  } catch (error) {
    console.error("Error saving to Firestore:", error);
  }
};
```

**Firestore `visionHistory` Schema:**
```json
{
  "docId_12345": {
    "userId": "uid_abc123",
    "landmarkName": "Eiffel Tower",
    "location": "Paris, France",
    "timestamp": "2026-04-23T12:00:00.000Z"
  }
}
```

### Vision → Avatar Tab Flow

**Step 1: Store Landmark in localStorage**
```typescript
const handleTalkToAvatar = async () => {
  if (analysisResult) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        const ctx = new AudioContextClass()
        await ctx.resume()
        const buffer = ctx.createBuffer(1, 1, 22050)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(ctx.destination)
        src.start(0)
        // Store context for reuse in home tab
        ;(window as any).__atlasAudioCtx = ctx
      }
    } catch {}
    
    // Store landmark in localStorage for home tab to read
    localStorage.setItem('visionLandmark', JSON.stringify({
      name: analysisResult.name,
      location: analysisResult.location
    }))
  }
  onTabChange?.('home')
}
```

**Step 2: Home Tab Reads and Auto-Fires Message**
```typescript
useEffect(() => {
  const landmarkData = localStorage.getItem('visionLandmark')
  if (!landmarkData) return
  localStorage.removeItem('visionLandmark')
  
  try {
    const { name, location } = JSON.parse(landmarkData)
    const msg = `I just detected ${name} in ${location}. Tell me about it!`
    // Auto-fire immediately with 300ms delay
    setTimeout(() => handleUserMessage(msg), 300)
  } catch (e) { console.error(e) }
}, [handleUserMessage])
```

**Data Flow:**
```
Vision Tab (photo) 
  → Analyze (OpenAI Vision)
  → Detect landmark
  → Save to visionHistory (Firebase)
  → Store landmark in localStorage
  → Pre-unlock AudioContext
  → Navigate to Home tab
    ↓
Home Tab
  → Read landmark from localStorage
  → Auto-fire message: "I just detected X in Y. Tell me about it!"
  → Reuse pre-unlocked AudioContext
  → Send to OpenAI Chat API
  → Get response
  → Play TTS audio
  → Save to avatarHistory
```

---

## 🔄 Cross-Tab Audio Context Management

### AudioContext Reuse Between Tabs

```typescript
// Vision Tab: Pre-unlock and store
;(window as any).__atlasAudioCtx = ctx

// Home Tab: Reuse or create new
if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
  audioCtxRef.current = (window as any).__atlasAudioCtx || new AudioContextClass()
  ;(window as any).__atlasAudioCtx = null
}
```

---

## 💾 localStorage Usage

| Key | Value | Purpose | Tab |
|-----|-------|---------|-----|
| `visionLandmark` | `{name, location}` | Pass landmark data from Vision to Home | Vision → Home |
| (future) `atlas_audio_unlocked` | `'true'` | Remember if user granted mic permission | Home |
| (future) `atlas_session_id` | sessionId | Persist session across page reloads | Home |

---

## 🌐 API Endpoints

### `/api/chat` - Chat Completion
**File:** `app/api/chat/route.ts`

```typescript
POST /api/chat
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "You are a travel guide..." },
    { "role": "user", "content": "What restaurants are near me?" },
    { "role": "assistant", "content": "Here are some great options..." }
  ]
}

Response:
{
  "message": "The best restaurants nearby are..."
}
```

### `/api/tts` - Text-to-Speech
**File:** `app/api/tts/route.ts` (assumed)

```typescript
POST /api/tts
Content-Type: application/json

{
  "text": "The Eiffel Tower is a wrought-iron lattice tower..."
}

Response: Binary audio data (MP3/WAV)
```

---

## 📊 Data Summary

| Data Type | Storage | Firebase Collection | Triggered By | Tab |
|-----------|---------|-------------------|--------------|-----|
| Chat messages + AI responses | Firebase | `chatHistory` | After each user message | Chat |
| Chat topic | Firebase | `chatHistory.topic` | Auto-detected after response | Chat |
| Chat location | Firebase | `chatHistory.location` | From user's location context | Chat |
| Chat suggestions (quick replies) | Browser memory | N/A | After each AI response | Chat |
| Landmark welcome message | Firebase | `chatHistory` | When Vision landmark detected | Chat |
| Avatar chat messages + responses | Firebase | `avatarHistory` | After each avatar conversation | Avatar |
| Avatar voice input (transcript) | Firebase | `avatarHistory` | Auto-captured in message object | Avatar |
| Avatar TTS audio | Plays in browser (not stored) | N/A | After AI response | Avatar |
| Landmark detection | Firebase | `visionHistory` | After Vision tab analysis | Vision |
| User profile | Firebase | `users` | At signup | All |
| Auth state | Firebase Auth | N/A | Login/logout/signup | All |
| Vision landmark (temp) | localStorage | N/A | User taps "Chat About" or "Talk to Avatar" | Vision → Chat/Avatar |
| AudioContext reference | window object | N/A | Vision → Avatar flow | Vision → Avatar |

---

## 🔐 Security Notes

1. **Firebase Rules** - Configure Firestore security rules to ensure:
   - Users can only read/write their own data
   - `userId` field matches authenticated user

   Example rules:
   ```
   match /avatarHistory/{document=**} {
     allow read, write: if request.auth.uid == resource.data.userId;
   }
   
   match /visionHistory/{document=**} {
     allow read, write: if request.auth.uid == resource.data.userId;
   }
   
   match /users/{userId} {
     allow read, write: if request.auth.uid == userId;
   }
   ```

2. **API Keys** - Ensure OpenAI API key is in `.env.local` (never in frontend code)

3. **Audio Playback** - Uses WebAudio API (safer than HTML Audio element on iOS)

---

## 📝 State Management

### Home Tab State
```typescript
const [messages, setMessages] = useState<Message[]>([])          // Chat history
const [suggestions, setSuggestions] = useState<string[]>([])     // AI suggestions
const [avatarStatus, setAvatarStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')
const [isAudioMuted, setIsAudioMuted] = useState(false)

// Refs (don't trigger re-renders)
const sessionId = useRef(Date.now().toString())                  // Unique session ID
const recognitionRef = useRef<any>(null)                         // Speech recognition instance
const audioCtxRef = useRef<any>(null)                            // AudioContext instance
const audioUnlockedRef = useRef(false)                           // AudioContext unlock flag
const messagesRef = useRef<Message[]>([])                        // Latest messages (prevents stale closure)
```

### Vision Tab State
```typescript
const [analysisResult, setAnalysisResult] = useState<Landmark | null>(null)  // Detected landmark
const [isAnalyzing, setIsAnalyzing] = useState(false)                        // Loading state
```

---

## 🚀 Future Enhancements

1. **Cloud Storage** - Save audio recordings to Firebase Storage
2. **Search History** - Full-text search over saved conversations
3. **Favorites** - Star/bookmark favorite landmarks or conversations
4. **Sharing** - Share conversation links with others
5. **Offline Mode** - Sync conversations when back online
6. **Conversation Summaries** - Auto-generate summaries of long conversations
7. **Image Cache** - Cache analyzed images locally

---

## 🔄 Chat vs Avatar Tab Comparison

| Feature | Chat Tab | Avatar Tab |
|---------|----------|-----------|
| **Collection Name** | `chatHistory` | `avatarHistory` |
| **Session ID** | Timestamp-based (new each clear) | Timestamp-based (one per session) |
| **Voice Input** | Planned (Mic button in UI) | Implemented (Web Speech API) |
| **TTS/Audio Output** | N/A | Yes (WebAudio API) |
| **Landmark Detection** | Receives from Vision tab via localStorage | Receives from Vision tab via localStorage |
| **Topic Detection** | Auto-detected (AI-generated) | Not tracked |
| **Quick Suggestions** | Generated after each response | Generated after each response |
| **Location Context** | Saved (locationName) | Saved (locationName) |
| **User Interaction** | Type messages + quick reply buttons | Tap to speak + voice output |
| **Audio Context** | N/A | Managed across tabs via window.__atlasAudioCtx |
| **Message Structure** | Same Message interface | Same Message interface |
| **Saves Every** | Every message (after AI response) | Every message (after AI response) |

---

## 🎯 Complete Data Flow Map

```
USER STARTS APP
  ↓
[Auth] Login → Save profile to 'users' collection
  ↓
[Chat Tab] OR [Avatar Tab] OR [Vision Tab]
  
═══════════════════════════════════════════════════════════════

CHAT TAB FLOW:
  User types message
    ↓
  Sends to OpenAI API
    ↓
  Gets AI response
    ↓
  Displays in chat
    ↓
  → Save to 'chatHistory' collection
  → Auto-detect topic
  → Generate 4 suggestions for quick reply

═══════════════════════════════════════════════════════════════

AVATAR TAB FLOW:
  User taps "Tap to Speak"
    ↓
  Speech recognition captures audio
    ↓
  Converts to text transcript
    ↓
  Sends to OpenAI Chat API
    ↓
  Gets AI response
    ↓
  Converts response to speech via OpenAI TTS
    ↓
  Plays audio via WebAudio API
    ↓
  → Save to 'avatarHistory' collection
  → Generate suggestions

═══════════════════════════════════════════════════════════════

VISION TAB FLOW:
  User uploads/captures photo
    ↓
  Sends to OpenAI Vision API (GPT-4o)
    ↓
  Gets landmark analysis: name, location, facts, tips
    ↓
  → Save to 'visionHistory' collection immediately
    ↓
  [User taps "Chat About"] 
    → Store landmark in localStorage
    → Navigate to Chat Tab
    → Chat Tab reads landmark from localStorage
    → Generates welcome message about landmark
    ↓
  [User taps "Talk to Avatar"]
    → Pre-unlock AudioContext
    → Store AudioContext in window.__atlasAudioCtx
    → Store landmark in localStorage
    → Navigate to Avatar Tab
    → Avatar Tab reads landmark from localStorage
    → Auto-fires message about landmark
    → Uses pre-unlocked AudioContext for TTS

═══════════════════════════════════════════════════════════════

HISTORY TAB:
  Reads from Firebase collections:
    ├── 'chatHistory' → Display as conversations
    ├── 'avatarHistory' → Display as conversations
    └── 'visionHistory' → Display as landmarks
  
  Can filter by:
    ├── All
    ├── Conversations (chat + avatar combined)
    ├── Landmarks (vision detections)
    └── Favorites (TBD)

═══════════════════════════════════════════════════════════════
```

---

## 🔐 Firestore Security Model

**All three collections follow the same security pattern:**

```firestore
match /chatHistory/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /avatarHistory/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /visionHistory/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

Each document stores `userId` field, and Firestore rules verify that the authenticated user's UID matches the document's `userId` before allowing access.



- [ ] Mic permission request on app load
- [ ] First voice input recognized and sent to API
- [ ] TTS audio plays after response
- [ ] Chat history saves to `avatarHistory` collection
- [ ] Vision landmark saves to `visionHistory` collection
- [ ] Vision → Home tab flow works (landmark detected auto-fires message)
- [ ] AudioContext persists across conversations
- [ ] Multiple users don't see each other's data (security)
- [ ] Works on iOS and Android
- [ ] Works in desktop Chrome/Safari

