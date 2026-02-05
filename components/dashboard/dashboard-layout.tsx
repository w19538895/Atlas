"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;
      case "vision":
        return <VisionTab />;
      case "chat":
        return <ChatTab />;
      case "history":
        return <HistoryTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card">
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
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
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
        <main className="flex-1 overflow-auto pb-20 lg:pb-6">{renderTabContent()}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb">
          <div className="flex items-center justify-around h-16">
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
