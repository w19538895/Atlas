"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Mic, Compass, MapPin, AlertCircle } from "lucide-react";
import { sendChatMessage, ChatMessage } from "@/lib/openai-service";

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

const quickReplies = [
  "What are the best restaurants nearby?",
  "Tell me about local culture",
  "Best time to visit this area?",
  "Hidden gems nearby",
];

export function ChatTab() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmarkContext, setLandmarkContext] = useState<{ name: string } | null>({
    name: "Eiffel Tower",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        conversationHistory
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* Context Banner */}
      {landmarkContext && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-primary/20">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">
            Discussing: <strong>{landmarkContext.name}</strong>
          </span>
          <button
            onClick={() => setLandmarkContext(null)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear context
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
        {messages.map((message) => (
          <div
            key={message.id}
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
              {message.context && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  Re: {message.context.name}
                </div>
              )}
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
            {quickReplies.map((reply) => (
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
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
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
