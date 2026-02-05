"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Calendar,
  MapPin,
  MessageCircle,
  MoreVertical,
  Eye,
  Trash2,
  Share2,
  Heart,
  Compass,
} from "lucide-react";

type FilterType = "all" | "conversations" | "landmarks" | "favorites";

interface HistoryItem {
  id: string;
  type: "landmark" | "conversation";
  title: string;
  location?: string;
  date: Date;
  preview: string;
  tags: string[];
  isFavorite: boolean;
  imageUrl?: string;
}

const mockHistory: HistoryItem[] = [
  {
    id: "1",
    type: "landmark",
    title: "Eiffel Tower",
    location: "Paris, France",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    preview: "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars...",
    tags: ["Historical", "Architecture"],
    isFavorite: true,
    imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    type: "conversation",
    title: "Best restaurants in Paris",
    location: "Paris, France",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    preview: "Here are some highly rated restaurants near the Eiffel Tower...",
    tags: ["Restaurant", "Food"],
    isFavorite: false,
  },
  {
    id: "3",
    type: "landmark",
    title: "Colosseum",
    location: "Rome, Italy",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    preview: "The Colosseum is an ancient amphitheater in the center of Rome...",
    tags: ["Historical", "Ancient"],
    isFavorite: true,
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=200&h=200&fit=crop",
  },
  {
    id: "4",
    type: "conversation",
    title: "Local customs in Japan",
    location: "Tokyo, Japan",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    preview: "Japanese culture has many interesting customs you should know about...",
    tags: ["Culture", "Tips"],
    isFavorite: false,
  },
  {
    id: "5",
    type: "landmark",
    title: "Machu Picchu",
    location: "Cusco, Peru",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    preview: "Machu Picchu is a 15th-century Inca citadel situated on a mountain ridge...",
    tags: ["Historical", "UNESCO"],
    isFavorite: true,
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=200&h=200&fit=crop",
  },
];

const filters: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "conversations", label: "Conversations" },
  { id: "landmarks", label: "Landmarks" },
  { id: "favorites", label: "Favorites" },
];

export function HistoryTab() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState(mockHistory);

  const filteredHistory = history.filter((item) => {
    // Filter by type
    if (activeFilter === "conversations" && item.type !== "conversation") return false;
    if (activeFilter === "landmarks" && item.type !== "landmark") return false;
    if (activeFilter === "favorites" && !item.isFavorite) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const toggleFavorite = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">History</h2>
        <p className="text-muted-foreground">Your past interactions and discoveries</p>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "shrink-0",
                activeFilter !== filter.id && "bg-transparent"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Search & Date */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="shrink-0 bg-transparent">
            <Calendar className="h-4 w-4 mr-2" />
            Date
          </Button>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-16 h-16 rounded-xl flex items-center justify-center",
                          item.type === "landmark" ? "bg-primary/10" : "bg-accent/10"
                        )}
                      >
                        {item.type === "landmark" ? (
                          <MapPin className="w-6 h-6 text-primary" />
                        ) : (
                          <MessageCircle className="w-6 h-6 text-accent" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              item.isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"
                            )}
                          />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {item.location && (
                      <p className="text-sm text-muted-foreground mb-1">{item.location}</p>
                    )}

                    <p className="text-sm text-muted-foreground/70 truncate mb-2">{item.preview}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <Compass className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No history yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start exploring to build your history. Your conversations and landmark discoveries will
            appear here.
          </p>
        </div>
      )}
    </div>
  );
}
