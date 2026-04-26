"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Mic, Compass, MapPin, AlertCircle } from "lucide-react";
import { sendChatMessage, ChatMessage } from "@/lib/openai-service";
import { useLocation } from "@/lib/LocationContext";
import { auth, db } from "@/firebase.config";
import { setDoc, doc } from "firebase/firestore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: {
    type: "landmark";
    name: string;
  };
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello! I'm your AI travel guide. I can help you discover landmarks, find local recommendations, and answer your travel questions. What would you like to know?",
    timestamp: new Date(Date.now() - 60000),
  },
];

const defaultSuggestions = [
  "What are the best restaurants nearby?",
  "Tell me about local culture",
  "Best time to visit this area?",
  "Hidden gems nearby",
];

export function ChatTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  // Check for pending landmark synchronously to avoid flicker
  const pendingLandmark = typeof window !== 'undefined' 
    ? localStorage.getItem('visionLandmark') 
    : null;

  // Start with empty messages if landmark pending, otherwise show default hello message
  const [messages, setMessages] = useState<Message[]>(pendingLandmark ? [] : initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmarkContext, setLandmarkContext] = useState<{ name: string } | null>({
    name: "Eiffel Tower",
  });
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const [hasProcessedLandmark, setHasProcessedLandmark] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { latitude, longitude, locationName } = useLocation();
  const currentUser = auth.currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check for landmark data from vision tab every time tab becomes visible
    const checkForLandmark = () => {
      const landmarkData = localStorage.getItem('visionLandmark');
      if (landmarkData && !hasProcessedLandmark) {
        try {
          const { name, location } = JSON.parse(landmarkData);
          localStorage.removeItem('visionLandmark'); // Delete immediately after reading
          
          setCurrentTopic(name);
          setHasProcessedLandmark(true);
          
          // Generate welcome message from OpenAI about the landmark
          generateLandmarkWelcome(name, location);
        } catch (error) {
          console.error("Error parsing landmark data:", error);
        }
      }
    };

    // Check on mount
    checkForLandmark();

    // Check when page becomes visible (tab is switched back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForLandmark();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasProcessedLandmark]);

  useEffect(() => {
    const historyData = localStorage.getItem('historyConversation')
    if (!historyData) return
    localStorage.removeItem('historyConversation')
    try {
      const { messages: savedMessages, sessionId: savedSessionId, type } = JSON.parse(historyData)
      if (type === 'chat' && savedMessages.length > 0) {
        const restored = savedMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        setMessages(restored)
        setSessionId(savedSessionId)
        setTimeout(() => generateSuggestions(restored), 500)
      }
    } catch (e) { console.error(e) }
  }, [])

  const generateLandmarkWelcome = async (landmarkName: string, landmarkLocation: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a warm and enthusiastic travel guide. Generate a brief 2-3 sentence welcome message about ${landmarkName} in ${landmarkLocation}. Be inviting and encourage the user to ask questions about this landmark. Keep it conversational and friendly.`,
            },
            {
              role: "user",
              content: `Tell me about ${landmarkName}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const welcomeMessage = data.message?.trim() || "";

      if (welcomeMessage) {
        // Replace initial messages with landmark welcome only (skip default welcome)
        const welcomeMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        };

        setMessages([welcomeMsg]);

        // Generate landmark-specific suggestions
        setTimeout(() => {
          generateLandmarkSuggestions([welcomeMsg], landmarkName);
        }, 0);
      }
    } catch (error) {
      console.error("Error generating landmark welcome:", error);
    }
  };

  const generateLandmarkSuggestions = async (chatMessages: Message[], landmarkName: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a travel assistant. Generate exactly 4 short follow-up question suggestions specific to ${landmarkName} that a visitor might want to ask. Each suggestion must be under 8 words. Return ONLY a valid JSON array of 4 strings like this: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"] — nothing else, no explanation, no markdown`,
            },
            {
              role: "user",
              content: `Generate questions about ${landmarkName}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const responseText = data.message?.trim() || "";

      try {
        const parsedSuggestions = JSON.parse(responseText);
        if (Array.isArray(parsedSuggestions) && parsedSuggestions.length === 4 && parsedSuggestions.every((s: any) => typeof s === "string")) {
          setSuggestions(parsedSuggestions);
        }
      } catch (parseError) {
        console.warn("Failed to parse landmark suggestions JSON", parseError);
      }
    } catch (error) {
      console.error("Error generating landmark suggestions:", error);
    }
  };

  const detectTopic = async (chatMessages: Message[]) => {
    try {
      // Get last 3-4 messages
      const lastMessages = chatMessages.slice(-4);
      
      if (lastMessages.length === 0) {
        setCurrentTopic("");
        return;
      }

      // Format messages for topic detection
      const conversationForTopic = lastMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      // Call OpenAI with topic detection prompt
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a topic detector. Analyze the conversation and return ONLY a short 2-4 word topic label describing what travel topic is being discussed. If no clear travel topic exists return empty string. Return nothing else, no explanation, just the label or empty string.",
            },
            {
              role: "user",
              content: conversationForTopic,
            },
          ],
        }),
      });

      const data = await response.json();
      const topic = data.message?.trim() || "";
      setCurrentTopic(topic);
    } catch (error) {
      console.error("Topic detection error:", error);
      // Silently fail - don't show error to user
    }
  };

  const generateSuggestions = async (chatMessages: Message[]) => {
    try {
      // Get last 3-4 messages
      const lastMessages = chatMessages.slice(-4);
      
      if (lastMessages.length === 0) {
        setSuggestions(defaultSuggestions);
        return;
      }

      // Format messages for suggestion generation
      const conversationForSuggestions = lastMessages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      // Call OpenAI with suggestion generation prompt
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: `Generate exactly 3 short travel follow-up questions under 8 words each based on this conversation. Return ONLY a valid JSON array with exactly 3 string elements like this example: ["What is the history?","How do I get there?","What should I eat?"]. Do not return q1 q2 q3. Do not use markdown. Do not add any explanation. Just the JSON array.`
            },
            {
              role: "user",
              content: conversationForSuggestions,
            },
          ],
        }),
      });

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
    } catch (error) {
      console.error("Suggestion generation error:", error);
      // Silently fail - keep previous suggestions
    }
  };

  const saveChatToFirestore = async (chatMessages: Message[]) => {
    try {
      // Only save if user is authenticated
      if (!currentUser?.uid) {
        console.warn("User not authenticated, skipping chat history save");
        return;
      }

      if (chatMessages.length === 0) return;

      // Get last user and AI messages
      const lastUserMessage = [...chatMessages].reverse().find(msg => msg.role === "user")?.content || "";
      const lastAIResponse = [...chatMessages].reverse().find(msg => msg.role === "assistant")?.content || "";

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
      };

      // Save to Firestore using sessionId as document ID
      await setDoc(doc(db, "chatHistory", sessionId), chatData);
      
      console.log("Chat history saved successfully");
    } catch (error) {
      console.error("Error saving chat to Firestore:", error);
      // Silently fail - don't show error to user
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      context: landmarkContext ? { type: "landmark", name: landmarkContext.name } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      // Prepare conversation history for API (without context field)
      const conversationHistory: ChatMessage[] = messages
        .filter((msg) => msg.role === "assistant" || msg.role === "user")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Get AI response
      const response = await sendChatMessage(
        content.trim(),
        conversationHistory,
        locationName,
        latitude,
        longitude
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      
      // Save chat to Firestore, detect topic, and generate suggestions after AI response
      setTimeout(() => {
        saveChatToFirestore(updatedMessages);
        detectTopic(updatedMessages);
        generateSuggestions(updatedMessages);
      }, 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response. Please try again.";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    setCurrentTopic("");
    setSuggestions(defaultSuggestions);
    setLandmarkContext(null);
    setSessionId(Date.now().toString()); // Generate new sessionId for next conversation
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* Context Banner */}
      {currentTopic && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20 animate-fade-in">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">
            Discussing: <strong>{currentTopic}</strong>
          </span>
          <button
            onClick={() => setCurrentTopic("")}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || `msg-${index}`}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/10">
                  <Compass className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "max-w-[80%] lg:max-w-[60%] space-y-1",
                message.role === "user" && "items-end"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground px-2">
                {formatTime(message.timestamp)}
              </span>
            </div>

            {message.role === "user" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground">U</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 items-start">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-primary/10">
                <Compass className="w-4 h-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Replies */}
        {!isTyping && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 text-sm bg-card border border-border rounded-full text-foreground hover:bg-muted transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white border-t border-border p-3 flex gap-2 items-center md:sticky-none">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your tour guide..."
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{input.length}/500</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={!input.trim() || isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
