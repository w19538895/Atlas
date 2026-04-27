"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Eye,
  MessageCircle,
  History,
  User,
  Bell,
  Compass,
  LogOut,
  Settings,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "@/lib/LocationContext";
import { HomeTab } from "./tabs/home-tab";
import { VisionTab } from "./tabs/vision-tab";
import { ChatTab } from "./tabs/chat-tab";
import { HistoryTab } from "./tabs/history-tab";
import { ProfileTab } from "./tabs/profile-tab";

type TabId = "home" | "vision" | "chat" | "history" | "profile";

const tabs = [
  { id: "home" as TabId, label: "Home", icon: Home },
  { id: "vision" as TabId, label: "Vision", icon: Eye },
  { id: "chat" as TabId, label: "Chat", icon: MessageCircle },
  { id: "history" as TabId, label: "History", icon: History },
  { id: "profile" as TabId, label: "Profile", icon: User },
];

interface DashboardLayoutProps {
  onLogout: () => void;
}

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { locationName, isLocating, locationError } = useLocation();

  useEffect(() => {
    if (!user) return;
    const loadPic = async () => {
      try {
        const { db } = await import('@/firebase.config');
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'userProfiles', (user as any).uid));
        if (snap.exists() && snap.data().profilePicUrl) {
          setProfilePicUrl(snap.data().profilePicUrl);
        }
      } catch {}
    };
    loadPic();
  }, [user]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab onTabChange={setActiveTab} />;
      case "vision":
        return <VisionTab onTabChange={setActiveTab} />;
      case "chat":
        return <ChatTab onTabChange={setActiveTab} />;
      case "history":
        return <HistoryTab onTabChange={setActiveTab} />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ display: 'flex', height: '100vh', overflow: 'hidden', overflowX: 'hidden' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <div className="relative">
            <Compass className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full" />
          </div>
          <span className="text-xl font-bold text-foreground">TravelMate</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Location Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {isLocating && "📍 Locating..."}
              {locationError && "📍 Location off"}
              {locationName && !isLocating && locationName}
              {!locationName && !isLocating && !locationError && "📍 Location off"}
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {profilePicUrl ? (
                <img src={profilePicUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 500 }}>
                  {((user as any)?.displayName || (user as any)?.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{(user as any)?.displayName || (user as any)?.email || 'Traveler'}</p>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(user as any)?.email || 'No email'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <Compass className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">TravelMate</span>
            </div>

            {/* Page Title - Desktop */}
            <h1 className="hidden lg:block text-lg font-semibold text-foreground capitalize">
              {activeTab}
            </h1>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    onClick={() => setActiveTab('profile')}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
                  >
                    {profilePicUrl ? (
                      <img src={profilePicUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 500 }}>
                        {((user as any)?.displayName || (user as any)?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{(user as any)?.displayName || (user as any)?.email || 'Traveler'}</p>
                    <p className="text-xs text-muted-foreground">{(user as any)?.email || 'No email'}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-hidden pb-16 md:pb-0 overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>{renderTabContent()}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 md:hidden h-[60px] bg-white border-t border-border z-[9999]">
          <div className="flex items-center justify-around w-full h-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
