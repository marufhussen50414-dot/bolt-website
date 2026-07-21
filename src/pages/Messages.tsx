import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Send, MessageSquare, ArrowLeft, ShieldCheck, Circle, Tag,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, GameListing, Message, Profile } from "../lib/types";
import { classNames, formatBDT, timeAgo } from "../lib/utils";

type ConversationRow = Conversation & {
  listing: Pick<GameListing, "id" | "title" | "price" | "images">;
  buyer: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
  seller: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
};

export default function Messages() {
  const { user, profile, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const listingIdParam = params.get("listing");

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [starterListing, setStarterListing] = useState<GameListing | null>(null);
  const [starterOpen, setStarterOpen] = useState(false);
  const [starterBody, setStarterBody] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

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
  }

  useEffect(() => {
    if (!user) return;
    loadConversations();
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

  useEffect(() => {
    if (listingIdParam && user) {
      (async () => {
        const { data } = await supabase
          .from("game_listings")
          .select("*")
          .eq("id", listingIdParam)
          .maybeSingle();
        if (data) {
          const listing = data as GameListing;
          if (listing.seller_id === user.id) {
            params.delete("listing"); setParams(params, { replace: true });
            return;
          }
          setStarterListing(listing);
          setStarterOpen(true);
        }
      })();
    }
  }, [listingIdParam, user, params, setParams]);

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

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    if (!user || !starterListing) return;
    const body = starterBody.trim();
    setSending(true);
    setError("");
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", starterListing.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", starterListing.seller_id)
      .maybeSingle();
    let convId = (existing as { id: string } | null)?.id ?? null;
    if (!convId) {
      const { data: created, error: cerr } = await supabase
        .from("conversations")
        .insert({ listing_id: starterListing.id, buyer_id: user.id, seller_id: starterListing.seller_id })
        .select("id")
        .single();
      if (cerr) { setSending(false); setError(cerr.message); return; }
      convId = (created as { id: string }).id;
    }
    if (body) {
      const { error: merr } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, sender_id: user.id, body });
      if (merr) { setSending(false); setError(merr.message); return; }
    }
    setSending(false);
    setStarterOpen(false);
    setStarterBody("");
    setStarterListing(null);
    params.delete("listing"); setParams(params, { replace: true });
    await loadConversations();
    setActiveId(convId);
  }

  function otherParty(c: ConversationRow) {
    const isBuyer = c.buyer_id === user?.id;
    return isBuyer ? c.seller : c.buyer;
  }

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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/15 text-primary-400"><MessageSquare size={22} /></div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Messages</h1>
          <p className="text-sm text-ink-400">Private chats with buyers and sellers about listings.</p>
        </div>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-error-400 border border-error-500/20">{error}</div>}

      <div className="grid md:grid-cols-[300px_1fr] gap-5 h-[600px]">
        <div className="card overflow-y-auto">
          <div className="p-3 border-b border-ink-800 text-xs font-semibold uppercase tracking-wide text-ink-500">Conversations</div>
          {loadingList ? (
            <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={28} className="mx-auto text-ink-600" />
              <p className="text-sm text-ink-400 mt-2">No conversations yet.</p>
              <Link to="/browse" className="text-xs text-primary-400 hover:text-primary-300 mt-2 inline-block">Browse listings to start a chat →</Link>
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((c) => {
                const other = otherParty(c);
                const unread = messages.filter((m) => m.conversation_id === c.id && m.sender_id !== user.id && !m.read_at).length;
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={classNames(
                      "w-full text-left flex items-center gap-3 px-3 py-3 transition-colors",
                      isActive ? "bg-primary-500/10" : "hover:bg-ink-800"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
                          {other?.full_name ?? other?.username ?? "User"}
                          {other?.is_verified && <ShieldCheck size={12} className="text-success-400 shrink-0" />}
                        </p>
                        <span className="text-xs text-ink-500 shrink-0">{timeAgo(c.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-ink-400 truncate flex items-center gap-1"><Tag size={10} /> {c.listing?.title ?? "Listing"}</p>
                    </div>
                    {unread > 0 && <span className="badge bg-primary-500 text-white text-xs shrink-0">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center text-center p-6">
              <div>
                <MessageSquare size={40} className="mx-auto text-ink-600" />
                <p className="text-ink-400 mt-3">Select a conversation to view messages.</p>
                <Link to="/browse" className="btn-secondary mt-4 inline-flex">Browse listings</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-ink-800">
                <button onClick={() => setActiveId(null)} className="md:hidden btn-ghost p-1"><ArrowLeft size={18} /></button>
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const other = otherParty(active);
                    return other?.avatar_url ? (
                      <img src={other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold">
                        {(other?.full_name ?? other?.username ?? "U")[0]?.toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {otherParty(active)?.full_name ?? otherParty(active)?.username ?? "User"}
                    </p>
                    <Link to={`/listing/${active.listing_id}`} className="text-xs text-primary-400 hover:text-primary-300 truncate flex items-center gap-1">
                      <Tag size={10} /> {active.listing?.title ?? "Listing"} • {active.listing ? formatBDT(active.listing.price) : ""}
                    </Link>
                  </div>
                </div>
              </div>

              <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ink-900/40">
                {loadingThread ? (
                  <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
                ) : messages.length === 0 ? (
                  <div className="grid place-items-center py-10 text-center">
                    <Circle size={24} className="text-ink-600" />
                    <p className="text-sm text-ink-400 mt-2">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={classNames("flex", mine ? "justify-end" : "justify-start")}>
                        <div className={classNames(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          mine ? "bg-primary-600 text-white rounded-br-sm" : "bg-ink-800 text-ink-100 rounded-bl-sm"
                        )}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={classNames("text-[10px] mt-1", mine ? "text-primary-200" : "text-ink-500")}>
                            {timeAgo(m.created_at)}{mine && m.read_at && " · read"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-ink-800">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button type="submit" disabled={sending || !draft.trim()} className="btn-primary">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {starterOpen && starterListing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setStarterOpen(false)}>
          <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-white">Message the seller</h3>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-ink-800 p-3">
              <div className="h-12 w-12 rounded-lg bg-ink-900 overflow-hidden shrink-0">
                {starterListing.images?.[0] && <img src={starterListing.images[0]} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{starterListing.title}</p>
                <p className="text-sm text-primary-400">{formatBDT(starterListing.price)}</p>
              </div>
            </div>
            <form onSubmit={startConversation} className="mt-4 space-y-3">
              <textarea
                value={starterBody}
                onChange={(e) => setStarterBody(e.target.value)}
                rows={3}
                className="input"
                placeholder="Hi, I'm interested in this account. Is it still available?"
                autoFocus
              />
              {error && <p className="text-sm text-error-400">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setStarterOpen(false); params.delete("listing"); setParams(params, { replace: true }); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={sending || !starterBody.trim()} className="btn-primary">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />} Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!profile?.full_name && (
        <p className="text-xs text-ink-500 mt-4 text-center">Tip: complete your <Link to="/profile" className="text-primary-400">profile</Link> so sellers recognize you in chats.</p>
      )}
    </div>
  );
}
