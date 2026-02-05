"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LandingPage } from "@/components/landing-page";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

type View = "landing" | "login" | "signup" | "dashboard";

function AppContent() {
  const [view, setView] = useState<View>("landing");
  const { user, logout, loading } = useAuth();

  // Still loading auth state
  if (loading) {
    return null;
  }

  // If authenticated, show dashboard
  if (user) {
    return (
      <DashboardLayout
        onLogout={() => {
          logout();
          setView("landing");
        }}
      />
    );
  }

  // Otherwise show auth flow
  switch (view) {
    case "landing":
      return <LandingPage onGetStarted={() => setView("login")} />;
    case "login":
      return (
        <LoginForm
          onSwitchToSignup={() => setView("signup")}
          onSuccess={() => setView("dashboard")}
        />
      );
    case "signup":
      return (
        <SignupForm
          onSwitchToLogin={() => setView("login")}
          onSuccess={() => setView("dashboard")}
        />
      );
    default:
      return <LandingPage onGetStarted={() => setView("login")} />;
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
