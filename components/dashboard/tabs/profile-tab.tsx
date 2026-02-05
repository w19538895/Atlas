"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Pencil,
  Backpack,
  Palmtree,
  Landmark,
  UtensilsCrossed,
  CameraIcon,
  Dumbbell,
  Palette,
  DollarSign,
  CreditCard,
  Banknote,
  Globe,
  Volume2,
  Sun,
  Moon,
  Bell,
  MapPin,
  Castle,
  Theater,
  Wine,
  ShoppingBag,
  TreePine,
  Waves,
  Mountain,
  Soup,
  Building,
  Ticket,
  LogOut,
  RotateCcw,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const travelStyles = [
  { id: "adventure", label: "Adventure Seeker", icon: Backpack },
  { id: "relaxation", label: "Relaxation Focused", icon: Palmtree },
  { id: "cultural", label: "Cultural Explorer", icon: Landmark },
  { id: "food", label: "Food Enthusiast", icon: UtensilsCrossed },
  { id: "photography", label: "Photography Lover", icon: CameraIcon },
  { id: "active", label: "Active Traveler", icon: Dumbbell },
  { id: "art", label: "Art & Architecture", icon: Palette },
];

const budgetOptions = [
  { id: "budget", label: "Budget-Friendly", description: "Under $50/day", icon: DollarSign },
  { id: "moderate", label: "Moderate", description: "$50-150/day", icon: Banknote },
  { id: "luxury", label: "Luxury", description: "$150+/day", icon: CreditCard },
];

const interests = [
  { id: "historical", label: "Historical Sites", icon: Castle },
  { id: "entertainment", label: "Entertainment", icon: Theater },
  { id: "nightlife", label: "Nightlife", icon: Wine },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "nature", label: "Nature & Parks", icon: TreePine },
  { id: "beaches", label: "Beaches", icon: Waves },
  { id: "mountains", label: "Mountains", icon: Mountain },
  { id: "cuisine", label: "Local Cuisine", icon: Soup },
  { id: "museums", label: "Museums", icon: Building },
  { id: "events", label: "Events & Festivals", icon: Ticket },
];

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Russian",
];

export function ProfileTab() {
  const { user, logout } = useAuth();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["cultural", "food"]);
  const [selectedBudget, setSelectedBudget] = useState("moderate");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "historical",
    "cuisine",
    "museums",
  ]);
  const [language, setLanguage] = useState("English");
  const [voiceSpeed, setVoiceSpeed] = useState([50]);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const handleReset = () => {
    setSelectedStyles(["cultural", "food"]);
    setSelectedBudget("moderate");
    setSelectedInterests(["historical", "cuisine", "museums"]);
    setLanguage("English");
    setVoiceSpeed([50]);
    setVoiceGender("female");
    setVoiceEnabled(true);
    setTheme("auto");
    setNotifications(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold text-foreground">{user?.name || "Traveler"}</h2>
                <button className="text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <p className="text-muted-foreground mb-2">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Member since{" "}
                {user?.memberSince?.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                }) || "January 2024"}
              </p>
            </div>
            <Button variant="outline" className="bg-transparent">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Travel Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Backpack className="w-5 h-5 text-primary" />
            Travel Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {travelStyles.map((style) => {
              const isSelected = selectedStyles.includes(style.id);
              return (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <style.icon
                    className={cn("w-8 h-8", isSelected ? "text-primary" : "text-muted-foreground")}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium text-center",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Budget Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="w-5 h-5 text-primary" />
            Budget Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {budgetOptions.map((option) => {
              const isSelected = selectedBudget === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedBudget(option.id)}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isSelected ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <option.icon
                      className={cn(
                        "w-6 h-6",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={cn(
                        "font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Globe className="w-5 h-5 text-primary" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <Label className="text-foreground">Preferred Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <Label className="text-foreground flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Settings
            </Label>

            <div className="space-y-4 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enable voice responses</span>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Voice speed</span>
                  <span className="text-sm text-foreground">{voiceSpeed[0]}%</span>
                </div>
                <Slider
                  value={voiceSpeed}
                  onValueChange={setVoiceSpeed}
                  max={100}
                  step={10}
                  disabled={!voiceEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voice gender</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={voiceGender === "female" ? "default" : "outline"}
                    onClick={() => setVoiceGender("female")}
                    disabled={!voiceEnabled}
                    className={voiceGender !== "female" ? "bg-transparent" : ""}
                  >
                    Female
                  </Button>
                  <Button
                    size="sm"
                    variant={voiceGender === "male" ? "default" : "outline"}
                    onClick={() => setVoiceGender("male")}
                    disabled={!voiceEnabled}
                    className={voiceGender !== "male" ? "bg-transparent" : ""}
                  >
                    Male
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <Label className="text-foreground flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Theme
            </Label>
            <div className="flex gap-2">
              {(["light", "dark", "auto"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={theme === t ? "default" : "outline"}
                  onClick={() => setTheme(t)}
                  className={cn("capitalize", theme !== t && "bg-transparent")}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <Label className="text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </Label>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Home Location */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Home Location
            </Label>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              Set your home location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Ticket className="w-5 h-5 text-primary" />
            Interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <interest.icon
                    className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium text-center",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {interest.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
        <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </Button>
        <Button variant="destructive" onClick={logout} className="flex-1">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
