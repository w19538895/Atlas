"use client";

import React from "react"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Compass, MapPin, MessageCircle, Camera, Sparkles } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-background blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-background blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-background/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Compass className="h-8 w-8 text-primary-foreground" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full animate-pulse" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">TravelMate</span>
        </div>
        <Button
          variant="outline"
          className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
          onClick={onGetStarted}
        >
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-24 lg:pt-20">
        {/* Animated Logo */}
        <div
          className="relative mb-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-500 ${isHovered ? "scale-110" : ""}`}
          >
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-primary-foreground/30 flex items-center justify-center">
              <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-primary-foreground flex items-center justify-center shadow-2xl">
                <Compass className="h-10 w-10 lg:h-14 lg:w-14 text-primary" />
              </div>
            </div>
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "12s", animationDirection: "reverse" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        </div>

        {/* Tagline */}
        <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground text-center mb-4 text-balance">
          Your AI-Powered
          <br />
          <span className="text-accent">Travel Companion</span>
        </h1>
        <p className="text-lg lg:text-xl text-primary-foreground/80 text-center max-w-xl mb-12 text-pretty">
          Discover landmarks, get personalized recommendations, and explore the world with your
          intelligent tour guide
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={onGetStarted}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Get Started
        </Button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          <FeatureCard
            icon={<Camera className="h-6 w-6" />}
            title="Landmark Recognition"
            description="Point your camera at any landmark and get instant information"
          />
          <FeatureCard
            icon={<MessageCircle className="h-6 w-6" />}
            title="AI Chat Guide"
            description="Ask questions and get personalized travel recommendations"
          />
          <FeatureCard
            icon={<MapPin className="h-6 w-6" />}
            title="Smart Exploration"
            description="Discover hidden gems based on your travel preferences"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-primary-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary-foreground mb-2">{title}</h3>
      <p className="text-primary-foreground/70 text-sm">{description}</p>
    </div>
  );
}
