import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Send, MessageSquare, ArrowLeft, ShieldCheck, Tag, Search,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, GameListing, Message, Profile } from "../lib/types";
import { classNames, timeAgo } from "../lib/utils";

type ConversationRow = Conversation & {
  listing: Pick<GameListing, "id" | "title" | "price" | "images"> | null;
  buyer: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
  seller: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
};

export default function Messages() {
  const { user, profile, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const listingIdParam = params.get("listing");

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  async function loadConversations() {
    if (!user) return;
    setLoadingList(true);
    const { data, error: err } = await supabase
      .from("conversations")
      .select(`
        id, listing_id, buyer_id, seller_id, last_message_at, created_at,
        listing:game_listings(id, title, price, images),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, username, avatar_url, is_verified),
        seller:profiles!conversations_seller_id_fkey(id, full_name, username, avatar_url, is_verified)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (err) setError(err.message);
    setConversations((data as unknown as ConversationRow[]) ?? []);
    setLoadingList(false);
  }

  async function loadUnreadCounts() {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("conversation_id")
      .neq("sender_id", user.id)
      .is("read_at", null);
    const map: Record<string, number> = {};
    for (const m of (data ?? []) as { conversation_id: string }[]) {
      map[m.conversation_id] = (map[m.conversation_id] ?? 0) + 1;
    }
    setUnreadMap(map);
  }

  async function loadThread(convId: string) {
    setLoadingThread(true);
    const { data, error: err } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    setMessages((data as Message[]) ?? []);
    setLoadingThread(false);
  }

  async function markRead(convId: string) {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);
    setUnreadMap((prev) => ({ ...prev, [convId]: 0 }));
  }

  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadUnreadCounts();
  }, [user]);

  useEffect(() => {
    if (activeId) {
      loadThread(activeId);
      markRead(activeId).then(loadConversations);
    }
  }, [activeId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, activeId]);

  // Arriving via ?listing=: find or create ONE thread for this buyer+seller pair,
  // then open it directly with the composer focused. The listing is kept as
  // optional context on the conversation, never as a grouping key.
  useEffect(() => {
    if (!listingIdParam || !user) return;
    setStarting(true);
    (async () => {
      const { data } = await supabase
        .from("game_listings")
        .select("*")
        .eq("id", listingIdParam)
        .maybeSingle();
      if (!data) { setStarting(false); return; }
      const listing = data as GameListing;
      if (listing.seller_id === user.id) {
        params.delete("listing"); setParams(params, { replace: true });
        setStarting(false);
        return;
      }
      // One thread per (buyer, seller) pair regardless of listing.
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("seller_id", listing.seller_id)
        .maybeSingle();
      let convId = (existing as { id: string } | null)?.id ?? null;
      if (!convId) {
        const { data: created } = await supabase
          .from("conversations")
          .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.seller_id })
          .select("id")
          .single();
        if (created) convId = (created as { id: string }).id;
      }
      params.delete("listing"); setParams(params, { replace: true });
      await loadConversations();
      if (convId) setActiveId(convId);
      setStarting(false);
      setTimeout(() => draftRef.current?.focus(), 100);
    })();
  }, [listingIdParam, user, params, setParams]);

  // Realtime: live updates for conversations, thread, and unread counts.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === msg.conversation_id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], last_message_at: msg.created_at };
          next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          return next;
        });
        if (msg.conversation_id === activeId) {
          setMessages((m) => [...m, msg]);
          if (msg.sender_id !== user.id) markRead(msg.conversation_id).then(loadConversations);
        } else if (msg.sender_id !== user.id) {
          setUnreadMap((prev) => ({ ...prev, [msg.conversation_id]: (prev[msg.conversation_id] ?? 0) + 1 }));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadUnreadCounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !user) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { data, error: err } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, body })
      .select("*")
      .single();
    setSending(false);
    if (err) { setError(err.message); return; }
    setDraft("");
    setMessages((m) => [...m, data as Message]);
    loadConversations();
  }

  function otherParty(c: ConversationRow) {
    const isBuyer = c.buyer_id === user?.id;
    return isBuyer ? c.seller : c.buyer;
  }

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const other = otherParty(c);
    const name = (other?.full_name ?? other?.username ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || (c.listing?.title ?? "").toLowerCase().includes(search.toLowerCase());
  });

  if (authLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!user) return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="card p-8">
        <h2 className="font-display text-xl font-bold text-white">Log in to use Messages</h2>
        <p className="text-sm text-ink-400 mt-2">Sign in to chat with buyers and sellers.</p>
        <Link to="/login?redirect=/messages" className="btn-primary mt-5 inline-flex">Log In</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/15 text-primary-400"><MessageSquare size={22} /></div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Messages</h1>
          <p className="text-sm text-ink-400">One unified thread per buyer and seller.</p>
        </div>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-error-400 border border-error-500/20">{error}</div>}

      <div className="card overflow-hidden h-[640px] flex">
        {/* Sidebar */}
        <div className={classNames("w-full md:w-[320px] flex flex-col border-r border-ink-800", activeId ? "hidden md:flex" : "flex")}>
          <div className="p-3 border-b border-ink-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="input pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} className="mx-auto text-ink-600" />
                <p className="text-sm text-ink-400 mt-2">{conversations.length === 0 ? "No conversations yet." : "No matches found."}</p>
                {conversations.length === 0 && <Link to="/browse" className="text-xs text-primary-400 hover:text-primary-300 mt-2 inline-block">Browse listings to start a chat →</Link>}
              </div>
            ) : (
              filtered.map((c) => {
                const other = otherParty(c);
                const unread = unreadMap[c.id] ?? 0;
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={classNames(
                      "w-full text-left flex items-center gap-3 px-3 py-3 transition-colors border-l-2",
                      isActive ? "bg-primary-500/10 border-primary-500" : "border-transparent hover:bg-ink-800"
                    )}
                  >
                    <div className="relative shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold">
                          {(other?.full_name ?? other?.username ?? "U")[0]?.toUpperCase()}
                        </div>
                      )}
                      {unread > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-900">{unread}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={classNames("text-sm truncate flex items-center gap-1", unread > 0 ? "font-bold text-white" : "font-semibold text-ink-200")}>
                          {other?.full_name ?? other?.username ?? "User"}
                          {other?.is_verified && <ShieldCheck size={12} className="text-success-400 shrink-0" />}
                        </p>
                        <span className="text-[11px] text-ink-500 shrink-0">{timeAgo(c.last_message_at)}</span>
                      </div>
                      {c.listing?.title && (
                        <p className="text-xs text-ink-400 truncate flex items-center gap-1 mt-0.5"><Tag size={10} className="shrink-0" /> {c.listing.title}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={classNames("flex-1 flex flex-col", activeId ? "flex" : "hidden md:flex")}>
          {starting ? (
            <div className="flex-1 grid place-items-center"><Loader2 className="animate-spin text-primary-500" size={26} /></div>
          ) : !active ? (
            <div className="flex-1 grid place-items-center text-center p-6">
              <div>
                <MessageSquare size={40} className="mx-auto text-ink-600" />
                <p className="text-ink-400 mt-3">Select a conversation to view messages.</p>
                <Link to="/browse" className="btn-secondary mt-4 inline-flex">Browse listings</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-ink-800 bg-ink-900/30">
                <button onClick={() => setActiveId(null)} className="md:hidden btn-ghost p-1"><ArrowLeft size={18} /></button>
                <Link
                  to={`/profile/${otherParty(active)?.id ?? ""}`}
                  className="flex items-center gap-3 min-w-0 rounded-lg p-1 -m-1 transition-colors hover:bg-ink-800/60"
                >
                  {(() => {
                    const other = otherParty(active);
                    return other?.avatar_url ? (
                      <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-ink-700" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold">
                        {(other?.full_name ?? other?.username ?? "U")[0]?.toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate flex items-center gap-1 group-hover:text-primary-300">
                      {otherParty(active)?.full_name ?? otherParty(active)?.username ?? "User"}
                      {otherParty(active)?.is_verified && <ShieldCheck size={12} className="text-success-400" />}
                    </p>
                    <p className="text-[11px] text-ink-500 mt-0.5">Direct conversation</p>
                  </div>
                </Link>
              </div>

              <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2" style={{ backgroundColor: "#1E293B" }}>
                {loadingThread ? (
                  <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
                ) : messages.length === 0 ? (
                  <div className="grid place-items-center py-10 text-center">
                    <MessageSquare size={24} className="text-ink-600" />
                    <p className="text-sm text-ink-400 mt-2">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={classNames("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={classNames(
                          "max-w-[80%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug shadow-sm",
                          mine ? "text-white rounded-br-md" : "text-slate-100 rounded-bl-md"
                        )} style={mine ? { backgroundColor: "#0E7490" } : { backgroundColor: "#334155" }}>
                          <p className="whitespace-pre-wrap break-words">
                            <span>{m.body}</span>
                            <span className={classNames(
                              "inline-block ml-1.5 translate-y-[1px] text-[10px] leading-none whitespace-nowrap",
                              mine ? "text-white/60" : "text-slate-400"
                            )}>
                              {timeAgo(m.created_at)}{mine && m.read_at ? " · read" : ""}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-ink-800 bg-ink-900/30">
                <input
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4" aria-label="Send message">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {!profile?.full_name && (
        <p className="text-xs text-ink-500 mt-4 text-center">Tip: complete your <Link to="/profile" className="text-primary-400">profile</Link> so sellers recognize you in chats.</p>
      )}
    </div>
  );
}
