"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Compass, Volume2, VolumeX, MapPin, Clock, MessageCircle } from "lucide-react";

type Status = "idle" | "listening" | "speaking";

const recentInteractions = [
  {
    id: 1,
    type: "landmark",
    title: "Eiffel Tower",
    location: "Paris, France",
    time: "2 hours ago",
    preview: "The Eiffel Tower is a wrought-iron lattice tower...",
  },
  {
    id: 2,
    type: "chat",
    title: "Best restaurants nearby",
    location: "Current location",
    time: "Yesterday",
    preview: "Here are some highly rated restaurants...",
  },
  {
    id: 3,
    type: "landmark",
    title: "Colosseum",
    location: "Rome, Italy",
    time: "2 days ago",
    preview: "The Colosseum is an ancient amphitheater...",
  },
];

export function HomeTab() {
  const [status, setStatus] = useState<Status>("idle");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [response, setResponse] = useState("");
  const [pulseRings, setPulseRings] = useState<number[]>([]);

  // Simulate status changes for demo
  const handleMicPress = () => {
    if (status === "idle") {
      setStatus("listening");
      setResponse("");
      // Simulate listening then speaking
      setTimeout(() => {
        setStatus("speaking");
        setResponse(
          "Hello! I'm your AI travel guide. I can help you discover landmarks, find local recommendations, and answer your travel questions. Just ask me anything about your destination!"
        );
        setTimeout(() => setStatus("idle"), 5000);
      }, 3000);
    } else {
      setStatus("idle");
    }
  };

  // Create pulse rings when listening
  useEffect(() => {
    if (status === "listening") {
      const interval = setInterval(() => {
        setPulseRings((prev) => [...prev, Date.now()]);
      }, 600);
      return () => clearInterval(interval);
    } else {
      setPulseRings([]);
    }
  }, [status]);

  // Clean up old pulse rings
  useEffect(() => {
    if (pulseRings.length > 3) {
      setPulseRings((prev) => prev.slice(-3));
    }
  }, [pulseRings]);

  const getStatusColor = () => {
    switch (status) {
      case "listening":
        return "text-accent";
      case "speaking":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "listening":
        return "Listening...";
      case "speaking":
        return "Speaking...";
      default:
        return "Idle";
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center pt-4 lg:pt-8">
        {/* Animated Avatar */}
        <div className="relative mb-6">
          {/* Pulse rings */}
          {pulseRings.map((id) => (
            <div
              key={id}
              className="absolute inset-0 rounded-full border-2 border-primary animate-ping"
              style={{ animationDuration: "1.5s" }}
            />
          ))}

          {/* Glowing border */}
          <div
            className={cn(
              "w-48 h-48 lg:w-64 lg:h-64 rounded-full p-1 transition-all duration-500",
              status === "listening" && "bg-gradient-to-r from-accent via-primary to-accent animate-spin",
              status === "speaking" && "bg-gradient-to-r from-primary to-primary/70",
              status === "idle" && "bg-gradient-to-r from-muted to-muted-foreground/30"
            )}
            style={{ animationDuration: status === "listening" ? "3s" : undefined }}
          >
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
              <div
                className={cn(
                  "w-40 h-40 lg:w-56 lg:h-56 rounded-full flex items-center justify-center transition-all duration-300",
                  status === "listening" && "bg-accent/10",
                  status === "speaking" && "bg-primary/10",
                  status === "idle" && "bg-muted"
                )}
              >
                <Compass
                  className={cn(
                    "w-20 h-20 lg:w-28 lg:h-28 transition-all duration-300",
                    status === "listening" && "text-accent scale-110",
                    status === "speaking" && "text-primary animate-pulse",
                    status === "idle" && "text-primary"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
          Your Personal Tour Guide
        </h2>
        <div className="flex items-center gap-2 mb-8">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              status === "listening" && "bg-accent animate-pulse",
              status === "speaking" && "bg-primary animate-pulse",
              status === "idle" && "bg-muted-foreground"
            )}
          />
          <span className={cn("text-sm font-medium transition-colors", getStatusColor())}>
            {getStatusText()}
          </span>
        </div>

        {/* Voice Controls */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={handleMicPress}
            className={cn(
              "w-20 h-20 rounded-full shadow-lg transition-all duration-300",
              status === "listening"
                ? "bg-accent hover:bg-accent/90 scale-110"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            <Mic className={cn("w-8 h-8", status === "listening" && "animate-pulse")} />
          </Button>
          <p className="text-sm text-muted-foreground">
            {status === "listening" ? "Release to stop" : "Tap to speak"}
          </p>

          {/* Voice toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className="text-muted-foreground"
          >
            {isVoiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Voice on
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Voice off
              </>
            )}
          </Button>
        </div>

        {/* Response Area */}
        {response && (
          <Card className="w-full max-w-lg mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-4">
              <p className="text-foreground leading-relaxed">{response}</p>
            </CardContent>
          </Card>
        )}

        {/* Waveform visualization */}
        {status === "listening" && (
          <div className="flex items-center gap-1 mt-6">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-accent rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.5s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Interactions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Interactions</h3>
        <div className="grid gap-3">
          {recentInteractions.map((interaction) => (
            <Card
              key={interaction.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    interaction.type === "landmark" ? "bg-primary/10" : "bg-accent/10"
                  )}
                >
                  {interaction.type === "landmark" ? (
                    <MapPin className="w-5 h-5 text-primary" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">{interaction.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {interaction.time}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{interaction.location}</p>
                  <p className="text-sm text-muted-foreground/70 truncate">{interaction.preview}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
