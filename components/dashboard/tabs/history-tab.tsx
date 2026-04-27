"use client";

import { useEffect, useState } from "react";
import { useAuth } from '@/lib/auth-context';
import { cn } from "@/lib/utils";
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
  MessageCircle,
  MoreVertical,
  Trash2,
  MapPin,
} from "lucide-react";

type FilterType = "all" | "voice" | "chat";

interface HistoryItem {
  id: string;
  type: "landmark" | "conversation";
  title: string;
  location?: string;
  date: Date;
  preview: string;
  tags: string[];
  imageUrl?: string;
  messages?: any[];
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'voice', label: 'Voice' },
  { id: 'chat', label: 'Chat' },
];

export function HistoryTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'voice' | 'chat' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    loadHistory();
  }, [currentUser]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { db } = await import('@/firebase.config');
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const allItems: HistoryItem[] = [];

      try {
        const chatQuery = query(collection(db, 'chatHistory'), where('userId', '==', currentUser!.uid), orderBy('updatedAt', 'desc'));
        const chatDocs = await getDocs(chatQuery);
        chatDocs.forEach(doc => {
          const data = doc.data();
          if (data.lastMessage) {
            allItems.push({
              id: doc.id, type: 'conversation',
              title: data.lastMessage.substring(0, 50) || 'Chat conversation',
              location: data.location || '', date: new Date(data.updatedAt),
              preview: data.aiLastResponse?.substring(0, 100) || '',
              tags: ['Chat'],
            });
          }
        });
      } catch (e) { console.error('Chat history error:', e); }

      try {
        const avatarQuery = query(collection(db, 'avatarHistory'), where('userId', '==', currentUser!.uid), orderBy('updatedAt', 'desc'));
        const avatarDocs = await getDocs(avatarQuery);
        avatarDocs.forEach(doc => {
          const data = doc.data();
          if (data.lastMessage) {
            allItems.push({
              id: doc.id, type: 'conversation',
              title: data.lastMessage.substring(0, 50) || 'Voice conversation',
              location: data.location || '', date: new Date(data.updatedAt),
              preview: data.aiLastResponse?.substring(0, 100) || '',
              tags: ['Voice'],
            });
          }
        });
      } catch (e) { console.error('Avatar history error:', e); }

      allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
      setHistory(allItems);
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const viewItem = async (item: HistoryItem) => {
    try {
      const { db } = await import('@/firebase.config');
      const { doc, getDoc } = await import('firebase/firestore');
      const col = item.tags.includes('Voice') ? 'avatarHistory' :
                  item.tags.includes('Chat') ? 'chatHistory' : 'visionHistory';
      const docSnap = await getDoc(doc(db, col, item.id));
      if (docSnap.exists()) {
        setSelectedItem({ ...item, messages: docSnap.data().messages || [] });
      } else {
        setSelectedItem(item);
      }
    } catch (e) {
      console.error('View error:', e);
      setSelectedItem(item);
    }
  };

  const continueItem = (item: HistoryItem) => {
    if (item.tags.includes('Landmark')) {
      localStorage.setItem('historyLandmark', JSON.stringify({ name: item.title, location: item.location }));
      onTabChange?.('vision');
    } else if (item.tags.includes('Voice')) {
      localStorage.setItem('historyConversation', JSON.stringify({ sessionId: item.id, messages: item.messages || [], type: 'voice' }));
      onTabChange?.('home');
    } else {
      localStorage.setItem('historyConversation', JSON.stringify({ sessionId: item.id, messages: item.messages || [], type: 'chat' }));
      onTabChange?.('chat');
    }
    setSelectedItem(null);
  };

  const deleteItem = async (id: string, tags: string[]) => {
    try {
      const { db } = await import('@/firebase.config')
      const { doc, deleteDoc } = await import('firebase/firestore')
      const col = tags.includes('Voice') ? 'avatarHistory' :
                  tags.includes('Chat') ? 'chatHistory' : 'visionHistory'
      await deleteDoc(doc(db, col, id))
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (e) {
      console.error('Delete error:', e)
    }
  };

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

  const filteredHistory = history.filter((item) => {
    if (activeFilter === 'voice' && !item.tags.includes('Voice')) return false;
    if (activeFilter === 'chat' && !item.tags.includes('Chat')) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '16px' }}>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">History</h2>
        <p className="text-muted-foreground">Your past voice and chat conversations</p>
      </div>

      <div className="space-y-4">
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.id as 'all' | 'voice' | 'chat' | 'favorites')}
              className={cn("shrink-0", activeFilter !== filter.id && "bg-transparent")}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-3" style={{ marginBottom: '16px' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      )}

      {!isLoading && filteredHistory.length > 0 && (
        <div className="space-y-3" style={{ overflowX: 'hidden', width: '100%', paddingBottom: '80px' }}>
          {filteredHistory.map((item, index) => (
            <div key={item.id || index} className="w-full overflow-hidden rounded-xl bg-white shadow p-4 hover:bg-muted/30 transition-colors" style={{ boxSizing: 'border-box', maxWidth: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', minWidth: 0 }}>
                <div style={{ width: '52px', height: '52px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.type === 'landmark' ? '#eff6ff' : '#f0fdf4' }}>
                      {item.type === 'landmark' ? (
                        <MapPin className="w-6 h-6 text-primary" />
                      ) : item.tags.includes('Voice') ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
                          <line x1="2" y1="12" x2="2" y2="12"/>
                          <line x1="6" y1="8" x2="6" y2="16"/>
                          <line x1="10" y1="5" x2="10" y2="19"/>
                          <line x1="14" y1="8" x2="14" y2="16"/>
                          <line x1="18" y1="10" x2="18" y2="14"/>
                          <line x1="22" y1="12" x2="22" y2="12"/>
                        </svg>
                      ) : (
                        <MessageCircle className="w-6 h-6" style={{ color: '#0ea5e9' }} />
                      )}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{item.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <MoreVertical style={{ width: '15px', height: '15px', color: '#9ca3af' }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => viewItem(item)}>
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteItem(item.id, item.tags)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {item.location && (
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</p>
                  )}
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.preview}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {item.tags.map((tag) => (
                        <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>{tag}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>{formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && filteredHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
            <span style={{ fontSize: '48px' }}>🧭</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No history yet</h3>
          <p className="text-muted-foreground max-w-sm">Start exploring to build your history. Your conversations and landmark discoveries will appear here.</p>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setSelectedItem(null)}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedItem.tags.includes('Voice') ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="12" x2="2" y2="12"/>
                      <line x1="6" y1="8" x2="6" y2="16"/>
                      <line x1="10" y1="5" x2="10" y2="19"/>
                      <line x1="14" y1="8" x2="14" y2="16"/>
                      <line x1="18" y1="10" x2="18" y2="14"/>
                      <line x1="22" y1="12" x2="22" y2="12"/>
                    </svg>
                  ) : (
                    <MessageCircle style={{ width: '14px', height: '14px', color: '#0ea5e9' }} />
                  )}
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{selectedItem.title}</div>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{selectedItem.location} · {formatDate(selectedItem.date)}</div>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedItem.tags.includes('Landmark') ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  {selectedItem.imageUrl && (
                    <img src={selectedItem.imageUrl} alt={selectedItem.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                      crossOrigin="anonymous" />
                  )}
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{selectedItem.title}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{selectedItem.location}</div>
                </div>
              ) : (
                selectedItem.messages?.map((msg: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? '#0ea5e9' : '#f3f4f6',
                      color: msg.role === 'user' ? 'white' : '#111827',
                      fontSize: '13px', lineHeight: 1.5
                    }}>{msg.content}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '0.5px solid #e5e7eb' }}>
              <button onClick={() => continueItem(selectedItem)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                {selectedItem.tags.includes('Voice') ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <line x1="2" y1="12" x2="2" y2="12"/>
                      <line x1="6" y1="8" x2="6" y2="16"/>
                      <line x1="10" y1="5" x2="10" y2="19"/>
                      <line x1="14" y1="8" x2="14" y2="16"/>
                      <line x1="18" y1="10" x2="18" y2="14"/>
                      <line x1="22" y1="12" x2="22" y2="12"/>
                    </svg>
                    Continue Voice Conversation
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <MessageCircle style={{ width: '16px', height: '16px', color: 'white' }} />
                    Continue Conversation
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
