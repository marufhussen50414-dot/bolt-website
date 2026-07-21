import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, Message } from "../lib/types";
import { timeAgo } from "../lib/utils";

export default function Messages() {
  const { id: activeId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [body, setBody] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .select("*, listing:game_listings(id, title, game_name, price, images), seller:profiles!seller_id(id, username, full_name, avatar_url, is_online), buyer:profiles!buyer_id(id, username, full_name, avatar_url)")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (error) console.warn("convos", error.message);
    setConversations((data as Conversation[]) ?? []);
    setLoadingList(false);
  }, [user]);

  const loadThread = useCallback(async (convId: string) => {
    setLoadingThread(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (error) console.warn("messages", error.message);
    setMessages((data as Message[]) ?? []);
    setLoadingThread(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) {
      const conv = conversations.find((c) => c.id === activeId);
      setActive(conv ?? null);
      loadThread(activeId);
    } else {
      setActive(null);
      setMessages([]);
    }
  }, [activeId, conversations, loadThread]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !active || !user) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: active.id, sender_id: user.id, body: text })
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .single();
    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", active.id)
        .then(() => {});
    }
    setSending(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  if (loadingList) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white mb-4">Messages</h1>

      {conversations.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-ink-500">
          <MessageSquare size={44} />
          <p className="mt-3 font-medium text-ink-300">No conversations yet</p>
          <p className="text-sm">Contact a seller from a listing to start chatting.</p>
          <Link to="/" className="btn-secondary mt-4">Browse listings</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 card overflow-hidden h-[70vh]">
          {/* Conversation list */}
          <div className={`border-r border-ink-800 overflow-y-auto ${active ? "hidden lg:block" : ""}`}>
            {conversations.map((c) => {
              const other = c.seller_id === user?.id ? c.buyer : c.seller;
              const name = other?.full_name ?? other?.username ?? "User";
              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className={`flex items-center gap-3 p-4 border-b border-ink-800/60 transition hover:bg-ink-800/40 ${activeId === c.id ? "bg-ink-800/60" : ""}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600/20 text-primary-300 font-semibold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-ink-400 truncate">{c.listing?.title}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Thread */}
          <div className={`lg:col-span-2 flex flex-col ${active ? "" : "hidden lg:flex"}`}>
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b border-ink-800 p-4">
                  <Link to="/messages" className="btn-ghost lg:hidden p-2"><ArrowLeft size={18} /></Link>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{active.listing?.title}</p>
                    <Link to={`/listing/${active.listing_id}`} className="text-xs text-primary-400 hover:underline">View listing</Link>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingThread ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-ink-500 py-8">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary-600 text-white rounded-br-sm" : "bg-ink-800 text-ink-100 rounded-bl-sm"}`}
                          >
                            <p>{m.body}</p>
                            <p className={`mt-1 text-[10px] ${mine ? "text-primary-200" : "text-ink-500"}`}>{timeAgo(m.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={endRef} />
                </div>

                <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-800 p-3">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message..."
                    className="input flex-1"
                  />
                  <button type="submit" disabled={sending || !body.trim()} className="btn-primary">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-ink-500">
                <p>Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
