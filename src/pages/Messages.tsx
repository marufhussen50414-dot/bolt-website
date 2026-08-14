import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Send, MessageSquare, ArrowLeft, ShieldCheck, Tag, Search,
  HandCoins, X, Store, ChevronDown, ChevronUp,
  ImagePlus, Check
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, GameListing, Message, Offer, Profile } from "../lib/types";
import { classNames, timeAgo, formatBDT } from "../lib/utils";

type ConversationRow = Conversation & {
  listing: Pick<GameListing, "id" | "title" | "price" | "images"> | null;
  buyer: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
  seller: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
};

type SellerListing = Pick<GameListing, "id" | "title" | "price" | "images" | "game_name" | "status">;

// Double Check Icon Component
function DoubleCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12.5L6 17L16.5 6.5" />
      <path d="M8 15L11 18L21.5 7.5" />
    </svg>
  );
}

function formatMessageTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
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

  // Active ID Reference for keeping Realtime socket updated seamlessly
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SellerListing | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerError, setOfferError] = useState("");

  // Listing context card + browse-seller-listings state
  const [contextListing, setContextListing] = useState<GameListing | null>(null);
  const [contextDismissed, setContextDismissed] = useState(false);
  const [showSellerListings, setShowSellerListings] = useState(false);
  const [browseListings, setBrowseListings] = useState<SellerListing[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  // Image attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxSrc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxSrc(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxSrc]);

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

  async function attachOffer(msg: Message): Promise<Message> {
    if (!msg.offer_id) return msg;
    const { data } = await supabase
      .from("offers")
      .select("*, listing:game_listings(id, title, price, images, game_name, status)")
      .eq("id", msg.offer_id)
      .maybeSingle();
    return { ...msg, offer: (data as Offer | null) ?? null };
  }

  async function loadThread(convId: string) {
    setLoadingThread(true);
    const { data, error: err } = await supabase
      .from("messages")
      .select("*, offer:offers(*, listing:game_listings(id, title, price, images, game_name, status))")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    setMessages((data as Message[]) ?? []);
    setLoadingThread(false);
  }

  // Instant Read Marker with Database update & local UI sync
  async function markRead(convId: string) {
    if (!user) return;
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("messages")
      .update({ read_at: nowIso })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);

    if (!updateErr) {
      setUnreadMap((prev) => ({ ...prev, [convId]: 0 }));
      setMessages((prev) =>
        prev.map((m) => (m.sender_id !== user.id && !m.read_at ? { ...m, read_at: nowIso } : m))
      );
    }
    window.dispatchEvent(new CustomEvent("messages-read"));
  }

  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadUnreadCounts();
  }, [user]);

  useEffect(() => {
    if (activeId) {
      loadThread(activeId);
      markRead(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, activeId]);

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
      setContextListing(listing);
      setContextDismissed(false);
      params.delete("listing"); setParams(params, { replace: true });
      await loadConversations();
      if (convId) setActiveId(convId);
      setStarting(false);
      setTimeout(() => draftRef.current?.focus(), 100);
    })();
  }, [listingIdParam, user, params, setParams]);

  // Realtime Global Listener (Subscribes to all INSERTs and UPDATEs across tables)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-realtime-v2-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Update sidebar order
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === newMsg.conversation_id);
            if (idx < 0) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], last_message_at: newMsg.created_at };
            next.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            return next;
          });

          // Append to active conversation window instantly
          if (newMsg.conversation_id === activeIdRef.current) {
            const withOffer = await attachOffer(newMsg);
            setMessages((prevMessages) => {
              if (prevMessages.some((m) => m.id === newMsg.id)) return prevMessages;
              return [...prevMessages, withOffer];
            });

            // Mark message read immediately if user is on this chat screen
            if (newMsg.sender_id !== user.id) {
              const readTime = new Date().toISOString();
              await supabase
                .from("messages")
                .update({ read_at: readTime })
                .eq("id", newMsg.id);

              setMessages((prev) =>
                prev.map((m) => (m.id === newMsg.id ? { ...m, read_at: readTime } : m))
              );
            }
          } else if (newMsg.sender_id !== user.id) {
            setUnreadMap((prev) => ({
              ...prev,
              [newMsg.conversation_id]: (prev[newMsg.conversation_id] ?? 0) + 1,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, read_at: updatedMsg.read_at, body: updatedMsg.body } : m))
          );
          loadUnreadCounts();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "offers" },
        (payload) => {
          const updated = payload.new as Offer;
          setMessages((prev) =>
            prev.map((m) =>
              m.offer_id === updated.id && m.offer
                ? { ...m, offer: { ...m.offer, ...updated, listing: m.offer.listing } }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  function onPickImage() {
    fileInputRef.current?.click();
  }

  function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be under 8 MB."); return; }
    setPendingFile(file);
    setPendingImage(URL.createObjectURL(file));
  }

  function clearPendingImage() {
    if (pendingImage) URL.revokeObjectURL(pendingImage);
    setPendingImage(null);
    setPendingFile(null);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !user) return;
    const body = draft.trim();
    if (!body && !pendingFile) return;

    let imageUrl: string | null = null;
    if (pendingFile) {
      setUploadingImage(true);
      const ext = pendingFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("chat-images")
        .upload(path, pendingFile, { cacheControl: "3600", upsert: false });
      setUploadingImage(false);
      if (upErr) { setError(upErr.message); return; }
      const { data: pub } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    setSending(true);
    const insertPayload: { conversation_id: string; sender_id: string; body: string; image_url?: string } = {
      conversation_id: activeId,
      sender_id: user.id,
      body,
    };
    if (imageUrl) insertPayload.image_url = imageUrl;
    const { data, error: err } = await supabase
      .from("messages")
      .insert(insertPayload)
      .select("*")
      .single();
    setSending(false);
    if (err) { setError(err.message); return; }
    setDraft("");
    clearPendingImage();
    setMessages((m) => [...m, data as Message]);
    loadConversations();
  }

  async function openOfferModal() {
    if (!active || !user) return;
    setShowOfferModal(true);
    setSelectedListing(null);
    setOfferPrice("");
    setOfferError("");
    setLoadingListings(true);
    const { data, error: err } = await supabase
      .from("game_listings")
      .select("id, title, price, images, game_name, status")
      .eq("seller_id", user.id)
      .in("status", ["active", "approved"])
      .order("created_at", { ascending: false });
    if (err) setOfferError(err.message);
    setSellerListings((data as SellerListing[]) ?? []);
    setLoadingListings(false);
  }

  function closeOfferModal() {
    setShowOfferModal(false);
    setSelectedListing(null);
    setOfferPrice("");
    setOfferError("");
  }

  function selectListing(li: SellerListing) {
    setSelectedListing(li);
    setOfferPrice("");
    setOfferError("");
  }

  async function handleSendOffer(e: FormEvent) {
    e.preventDefault();
    if (!active || !user || !selectedListing) return;
    const price = parseFloat(offerPrice);
    if (!price || price <= 0) { setOfferError("Enter a valid offer amount."); return; }
    setSendingOffer(true);
    setOfferError("");
    const otherPartyId = active.buyer_id === user.id ? active.seller_id : active.buyer_id;
    const { data: offerRow, error: offerErr } = await supabase
      .from("offers")
      .insert({
        conversation_id: active.id,
        listing_id: selectedListing.id,
        buyer_id: otherPartyId,
        seller_id: user.id,
        offer_price: price,
      })
      .select("*")
      .single();
    if (offerErr) { setSendingOffer(false); setOfferError(offerErr.message); return; }
    const offer = offerRow as Offer;
    const summary = `Offered ${formatBDT(price)} for "${selectedListing.title}"`;
    const { data: msgRow, error: msgErr } = await supabase
      .from("messages")
      .insert({ conversation_id: active.id, sender_id: user.id, body: summary, offer_id: offer.id })
      .select("*, offer:offers(*, listing:game_listings(id, title, price, images, game_name, status))")
      .single();
    setSendingOffer(false);
    if (msgErr) { setOfferError(msgErr.message); return; }
    setMessages((m) => [...m, msgRow as Message]);
    loadConversations();
    closeOfferModal();
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

  if (authLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-cyan-500" size={28} /></div>;
  if (!user) return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="card p-8">
        <h2 className="font-display text-xl font-bold text-white">Log in to use Messages</h2>
        <p className="text-sm text-ink-400 mt-2">Sign in to chat with buyers and sellers.</p>
        <Link to="/login?redirect=/messages" className="btn-primary mt-5 inline-flex">Log In</Link>
      </div>
    </div>
  );

  const iAmSeller = !!active && !!user && active.seller_id === user.id;
  const iAmBuyer = !!active && !!user && active.buyer_id === user.id;

  async function loadSellerListings(sellerId: string, excludeId?: string) {
    setLoadingBrowse(true);
    const { data, error: err } = await supabase
      .from("game_listings")
      .select("id, title, price, images, game_name, status")
      .eq("seller_id", sellerId)
      .in("status", ["active", "approved"])
      .neq("id", excludeId ?? "")
      .order("created_at", { ascending: false })
      .limit(8);
    if (err) setError(err.message);
    setBrowseListings((data as SellerListing[]) ?? []);
    setLoadingBrowse(false);
  }

  function toggleSellerListings() {
    if (!active) return;
    const next = !showSellerListings;
    setShowSellerListings(next);
    if (next) loadSellerListings(iAmBuyer ? active.seller_id : active.buyer_id, active.listing_id ?? undefined);
  }

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
      {error && <div className="card p-3 mb-4 text-sm text-error-400 border border-error-500/20">{error}</div>}

      <div className="card overflow-hidden h-[calc(100vh-100px)] min-h-[580px] flex border border-cyan-500/10 rounded-xl shadow-2xl bg-ink-950">
        {/* Sidebar */}
        <div className={classNames("w-full md:w-[350px] lg:w-[380px] flex flex-col border-r border-ink-800 bg-ink-900/60", activeId ? "hidden md:flex" : "flex")}>
          <div className="p-3 border-b border-ink-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full bg-ink-950 text-gray-200 placeholder-ink-400 text-sm rounded-lg pl-9 pr-4 py-2 border border-ink-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-ink-800/40">
            {loadingList ? (
              <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-cyan-400" size={22} /></div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} className="mx-auto text-ink-500" />
                <p className="text-sm text-ink-400 mt-2">{conversations.length === 0 ? "No chats available." : "No chats found."}</p>
                {conversations.length === 0 && <Link to="/browse" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block">Browse listings to start a chat →</Link>}
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
                      "w-full text-left flex items-center gap-3 px-3 py-3 transition-colors",
                      isActive ? "bg-cyan-500/10 border-l-2 border-cyan-400" : "hover:bg-ink-800/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-ink-700" />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white text-base font-bold">
                          {(other?.full_name ?? other?.username ?? "U")[0]?.toUpperCase()}
                        </div>
                      )}
                      {unread > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[11px] font-bold text-black">{unread}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={classNames("text-sm truncate flex items-center gap-1", unread > 0 ? "font-bold text-white" : "font-medium text-gray-200")}>
                          {other?.full_name ?? other?.username ?? "User"}
                          {other?.is_verified && <ShieldCheck size={13} className="text-cyan-400 shrink-0" />}
                        </p>
                        <span className={classNames("text-[11px] shrink-0", unread > 0 ? "text-cyan-400 font-semibold" : "text-ink-400")}>{timeAgo(c.last_message_at)}</span>
                      </div>
                      {c.listing?.title && (
                        <p className="text-xs text-ink-400 truncate flex items-center gap-1 mt-1"><Tag size={10} className="shrink-0 text-ink-500" /> {c.listing.title}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={classNames("flex-1 flex flex-col bg-ink-950", activeId ? "flex" : "hidden md:flex")}>
          {starting ? (
            <div className="flex-1 grid place-items-center"><Loader2 className="animate-spin text-cyan-400" size={26} /></div>
          ) : !active ? (
            <div className="flex-1 grid place-items-center text-center p-6 bg-ink-950">
              <div>
                <MessageSquare size={52} className="mx-auto text-ink-600 mb-2 opacity-50" />
                <h3 className="text-lg font-medium text-gray-200">GameHaatBD Messages</h3>
                <p className="text-xs text-ink-400 mt-1">Select a conversation to start messaging in real-time.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-ink-900/90 border-b border-ink-800 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setActiveId(null)} className="md:hidden text-ink-300 p-1 hover:bg-ink-800 rounded-full"><ArrowLeft size={20} /></button>
                  <Link
                    to={`/profile/${otherParty(active)?.id ?? ""}`}
                    className="flex items-center gap-3 min-w-0 group"
                  >
                    {(() => {
                      const other = otherParty(active);
                      return other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-ink-700" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 text-white text-sm font-bold">
                          {(other?.full_name ?? other?.username ?? "U")[0]?.toUpperCase()}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-100 truncate flex items-center gap-1 group-hover:text-cyan-400">
                        {otherParty(active)?.full_name ?? otherParty(active)?.username ?? "User"}
                        {otherParty(active)?.is_verified && <ShieldCheck size={13} className="text-cyan-400" />}
                      </p>
                      <p className="text-[11px] text-cyan-400 font-medium">online</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Listing context card */}
              {(contextListing || active?.listing) && !contextDismissed && (
                <div className="px-4 pt-2 z-10">
                  <div className="flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2">
                    <img
                      src={(contextListing ?? (active?.listing as GameListing | undefined))?.images?.[0]
                        ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=200"}
                      alt=""
                      className="h-9 w-9 rounded object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase text-cyan-400 tracking-wider">Discussing Item</p>
                      <p className="text-xs font-medium text-gray-200 truncate leading-tight">
                        {(contextListing ?? (active?.listing as GameListing | undefined))?.title ?? "Listing"}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 mr-1">
                      {formatBDT((contextListing ?? (active?.listing as GameListing | undefined))?.price ?? 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setContextDismissed(true)}
                      className="text-ink-400 hover:text-gray-200 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Browse seller's other listings */}
              {iAmBuyer && (
                <div className="px-4 pt-2 z-10">
                  <button
                    type="button"
                    onClick={toggleSellerListings}
                    className="flex w-full items-center gap-2 rounded-lg bg-ink-900 border border-ink-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-ink-800"
                  >
                    <Store size={13} className="text-cyan-400" />
                    <span>Browse {otherParty(active)?.full_name ?? otherParty(active)?.username ?? "seller"}'s other listings</span>
                    {showSellerListings ? <ChevronUp size={13} className="ml-auto text-ink-400" /> : <ChevronDown size={13} className="ml-auto text-ink-400" />}
                  </button>
                  {showSellerListings && (
                    <div className="mt-1.5 rounded-lg border border-ink-800 bg-ink-900 p-2 max-h-48 overflow-y-auto">
                      {loadingBrowse ? (
                        <div className="grid place-items-center py-4"><Loader2 className="animate-spin text-cyan-400" size={16} /></div>
                      ) : browseListings.length === 0 ? (
                        <p className="py-2 text-center text-xs text-ink-400">No other active listings.</p>
                      ) : (
                        <div className="space-y-1">
                          {browseListings.map((li) => (
                            <Link
                              key={li.id}
                              to={`/listing/${li.id}`}
                              className="flex items-center gap-2 rounded bg-ink-950 border border-ink-800 p-1.5 hover:bg-ink-800"
                            >
                              <img src={li.images?.[0]} alt="" className="h-8 w-8 rounded object-cover" />
                              <p className="text-xs text-gray-200 truncate flex-1">{li.title}</p>
                              <span className="text-xs font-bold text-cyan-400">{formatBDT(li.price)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Thread */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col bg-ink-950"
              >
                {loadingThread ? (
                  <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-cyan-400" size={22} /></div>
                ) : messages.length === 0 ? (
                  <div className="grid place-items-center py-10 text-center">
                    <p className="text-xs text-ink-400 bg-ink-900 border border-ink-800 px-3 py-1.5 rounded-lg shadow">Messages are end-to-end encrypted on GameHaatBD.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    if (m.offer_id && m.offer) {
                      return <OfferBubble key={m.id} mine={mine} message={m} userId={user.id} />;
                    }
                    return (
                      <div key={m.id} className={classNames("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={classNames(
                            "max-w-[80%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 text-sm shadow relative",
                            mine ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none" : "bg-ink-900 border border-ink-800 text-gray-100 rounded-tl-none"
                          )}
                        >
                          {m.image_url && (
                            <button type="button" onClick={() => setLightboxSrc(m.image_url!)} className="block mb-1 overflow-hidden rounded-lg">
                              <img
                                src={m.image_url}
                                alt="Chat image"
                                className="w-full max-w-[280px] max-h-[300px] object-cover hover:opacity-90 transition-opacity"
                              />
                            </button>
                          )}
                          {m.body && (
                            <span className="whitespace-pre-wrap break-words text-[13.5px] leading-snug mr-1">
                              {m.body}
                            </span>
                          )}
                          <span className={classNames("inline-flex items-center gap-1 text-[10px] select-none float-right mt-1 ml-2 align-bottom", mine ? "text-cyan-100/80" : "text-ink-400")}>
                            <span>{formatMessageTime(m.created_at)}</span>
                            {mine && (
                              m.read_at ? (
                                <DoubleCheckIcon className="w-4 h-4 text-cyan-200 inline-block -mt-0.5" />
                              ) : (
                                <Check size={14} className="text-cyan-100/70 inline-block" />
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-3 bg-ink-900 border-t border-ink-800 flex flex-col gap-2">
                {pendingImage && (
                  <div className="flex items-center gap-2 rounded-lg bg-ink-950 border border-ink-800 p-2">
                    <img src={pendingImage} alt="Preview" className="h-12 w-12 rounded object-cover shrink-0" />
                    <p className="text-xs text-gray-300 flex-1 truncate">Image selected</p>
                    <button type="button" onClick={clearPendingImage} className="text-ink-400 hover:text-white"><X size={16} /></button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChosen} className="hidden" />

                  {/* Give Offer Button */}
                  {iAmSeller && (
                    <button
                      type="button"
                      onClick={openOfferModal}
                      className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold transition-colors shrink-0 border border-cyan-500/30"
                      title="Give Offer"
                    >
                      <HandCoins size={16} />
                      <span>Give Offer</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onPickImage}
                    disabled={uploadingImage || sending}
                    className="p-2 text-ink-400 hover:text-white hover:bg-ink-800 rounded-full transition-colors"
                    title="Attach Image"
                  >
                    {uploadingImage ? <Loader2 size={20} className="animate-spin text-cyan-400" /> : <ImagePlus size={20} />}
                  </button>

                  <input
                    ref={draftRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-ink-950 text-gray-100 placeholder-ink-400 text-sm rounded-lg px-4 py-2.5 outline-none border border-ink-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500"
                  />

                  <button
                    type="submit"
                    disabled={sending || uploadingImage || (!draft.trim() && !pendingFile)}
                    className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all disabled:opacity-40 shadow-md"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4" onClick={closeOfferModal}>
          <div className="card w-full max-w-md max-h-[85vh] overflow-y-auto bg-ink-900 border border-ink-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-ink-800">
              <h3 className="text-base font-bold text-white">Give Discounted Offer</h3>
              <button type="button" onClick={closeOfferModal} className="text-ink-400 hover:text-white"><X size={18} /></button>
            </div>

            {offerError && <div className="mx-4 mt-3 rounded bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">{offerError}</div>}

            {!selectedListing ? (
              <div className="p-4 space-y-2">
                {loadingListings ? (
                  <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-cyan-400" size={20} /></div>
                ) : (
                  sellerListings.map((li) => (
                    <button
                      key={li.id}
                      type="button"
                      onClick={() => selectListing(li)}
                      className="flex w-full items-center gap-3 rounded-lg bg-ink-950 border border-ink-800 p-2.5 text-left hover:border-cyan-500/40"
                    >
                      <img src={li.images?.[0]} alt="" className="h-10 w-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{li.title}</p>
                        <p className="text-[11px] text-cyan-400">{formatBDT(li.price)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleSendOffer} className="p-4 space-y-3">
                <div className="rounded-lg bg-ink-950 border border-ink-800 p-3 flex gap-3">
                  <img src={selectedListing.images?.[0]} alt="" className="h-14 w-14 rounded object-cover" />
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{selectedListing.title}</p>
                    <p className="text-xs text-cyan-400 mt-1 font-bold">List Price: {formatBDT(selectedListing.price)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink-300 block mb-1">Offer Price (BDT)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full bg-ink-950 text-white px-3 py-2 rounded-lg text-sm outline-none border border-ink-800 focus:border-cyan-500"
                    placeholder="Enter discounted price"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={sendingOffer} className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg transition-all">
                  {sendingOffer ? "Sending..." : "Send Offer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className="max-w-full max-h-full rounded-lg border border-ink-800" />
        </div>
      )}
    </div>
  );
}

// Offer Bubble Component
function OfferBubble({ mine, message, userId }: { mine: boolean; message: Message; userId: string; }) {
  const offer = message.offer!;
  const isBuyer = offer.buyer_id === userId;
  const listing = offer.listing;

  return (
    <div className={classNames("flex", mine ? "justify-end" : "justify-start")}>
      <div className="w-[280px] rounded-xl overflow-hidden border border-cyan-500/30 bg-ink-900 shadow-lg">
        <div className="bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold text-cyan-400 flex items-center justify-between border-b border-cyan-500/20">
          <span>SPECIAL OFFER</span>
          <span className="text-[10px] text-ink-400 font-normal">{formatMessageTime(message.created_at)}</span>
        </div>
        <div className="p-3 flex gap-2.5">
          <img src={listing?.images?.[0]} alt="" className="h-12 w-12 rounded object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{listing?.title}</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-[11px] text-ink-400 line-through">{formatBDT(listing?.price ?? 0)}</span>
              <span className="text-sm font-bold text-cyan-400">{formatBDT(offer.offer_price)}</span>
            </div>
          </div>
        </div>
        <div className="p-2.5 bg-ink-950 border-t border-ink-800">
          {offer.status === "pending" && isBuyer ? (
            <Link
              to={`/checkout/${offer.listing_id}?offer=${offer.id}`}
              className="block w-full text-center py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Accept & Pay {formatBDT(offer.offer_price)}
            </Link>
          ) : (
            <span className="block text-center text-[11px] text-ink-400 capitalize">Status: {offer.status}</span>
          )}
        </div>
      </div>
    </div>
  );
}
