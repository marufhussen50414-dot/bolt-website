import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2, Send, MessageSquare, ArrowLeft, ShieldCheck, Tag, Search,
  HandCoins, X, ShoppingBag, ImageIcon, Store, ChevronDown, ChevronUp,
  ImagePlus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, GameListing, Message, Offer, OfferStatus, Profile } from "../lib/types";
import { classNames, timeAgo, formatBDT } from "../lib/utils";

type ConversationRow = Conversation & {
  listing: Pick<GameListing, "id" | "title" | "price" | "images"> | null;
  buyer: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
  seller: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "is_verified">;
};

type SellerListing = Pick<GameListing, "id" | "title" | "price" | "images" | "game_name" | "status">;

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

  async function markRead(convId: string) {
    if (!user) return;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);
    if (!count) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .neq("sender_id", user.id)
      .is("read_at", null);
    setUnreadMap((prev) => ({ ...prev, [convId]: 0 }));
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
      markRead(activeId).then(() => { loadConversations(); loadUnreadCounts(); });
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
      setContextListing(listing);
      setContextDismissed(false);
      params.delete("listing"); setParams(params, { replace: true });
      await loadConversations();
      if (convId) setActiveId(convId);
      setStarting(false);
      setTimeout(() => draftRef.current?.focus(), 100);
    })();
  }, [listingIdParam, user, params, setParams]);

  // Realtime: live updates for conversations, thread, unread counts, and offers.
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
          (async () => {
            const withOffer = await attachOffer(msg);
            setMessages((m) => [...m, withOffer]);
            if (msg.sender_id !== user.id) markRead(msg.conversation_id).then(loadConversations);
          })();
        } else if (msg.sender_id !== user.id) {
          setUnreadMap((prev) => ({ ...prev, [msg.conversation_id]: (prev[msg.conversation_id] ?? 0) + 1 }));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadUnreadCounts())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "offers" }, (payload) => {
        const updated = payload.new as Offer;
        setMessages((prev) => prev.map((m) =>
          m.offer_id === updated.id && m.offer
            ? { ...m, offer: { ...m.offer, ...updated, listing: m.offer.listing } }
            : m
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeId]);

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

  // ===== Make an Offer flow =====

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

              {/* Listing context card — shows which item the buyer is asking about */}
              {(contextListing || active?.listing) && !contextDismissed && (
                <div className="px-3 pt-3">
                  <div className="flex items-start gap-2.5 rounded-xl border border-primary-500/25 bg-primary-500/5 p-2.5">
                    <img
                      src={(contextListing ?? (active?.listing as GameListing | undefined))?.images?.[0]
                        ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=200"}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-300/80">Discussing</p>
                      <p className="text-sm font-semibold text-white truncate leading-tight">
                        {(contextListing ?? (active?.listing as GameListing | undefined))?.title ?? "Listing"}
                      </p>
                      <p className="text-xs text-primary-400 font-display font-bold">
                        {formatBDT((contextListing ?? (active?.listing as GameListing | undefined))?.price ?? 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContextDismissed(true)}
                      className="shrink-0 rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200"
                      aria-label="Dismiss"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Browse seller's other listings (buyer only) */}
              {iAmBuyer && (
                <div className="px-3 pt-2">
                  <button
                    type="button"
                    onClick={toggleSellerListings}
                    className="flex w-full items-center gap-2 rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 text-xs font-semibold text-ink-300 transition-colors hover:border-primary-500/40 hover:text-primary-300"
                  >
                    <Store size={14} />
                    <span>Browse {otherParty(active)?.full_name ?? otherParty(active)?.username ?? "seller"}'s other listings</span>
                    {showSellerListings ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                  </button>
                  {showSellerListings && (
                    <div className="mt-2 rounded-xl border border-ink-800 bg-ink-900/50 p-2 max-h-64 overflow-y-auto">
                      {loadingBrowse ? (
                        <div className="grid place-items-center py-6"><Loader2 className="animate-spin text-primary-500" size={18} /></div>
                      ) : browseListings.length === 0 ? (
                        <p className="py-4 text-center text-xs text-ink-500">No other active listings.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {browseListings.map((li) => (
                            <Link
                              key={li.id}
                              to={`/listing/${li.id}`}
                              className="flex w-full items-center gap-2.5 rounded-lg border border-ink-700/60 bg-ink-800/40 p-2 text-left transition-all hover:border-primary-500/50 hover:bg-ink-800"
                            >
                              <img
                                src={li.images?.[0]
                                  ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=200"}
                                alt=""
                                className="h-10 w-10 rounded-md object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate leading-tight">{li.title}</p>
                                <p className="text-[11px] text-ink-400 flex items-center gap-1"><Tag size={9} /> {li.game_name}</p>
                              </div>
                              <span className="font-display text-sm font-bold text-primary-400 shrink-0">{formatBDT(li.price)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2" style={{ backgroundColor: "#18181B" }}>
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
                    // Offer card
                    if (m.offer_id && m.offer) {
                      return (
                        <OfferBubble
                          key={m.id}
                          mine={mine}
                          message={m}
                          userId={user.id}
                        />
                      );
                    }
                    return (
                      <div key={m.id} className={classNames("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}>
                        <div className={classNames(
                          "max-w-[80%] rounded-2xl shadow-sm overflow-hidden",
                          mine ? "rounded-br-md" : "rounded-bl-md"
        )} style={mine ? { backgroundColor: "#164E63" } : { backgroundColor: "#333333" }}>
                          {m.image_url && (
                            <button type="button" onClick={() => setLightboxSrc(m.image_url!)} className="block">
                              <img
                                src={m.image_url}
                                alt="Chat image"
                                className="w-full max-w-[260px] max-h-[280px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </button>
                          )}
                          {m.body && (
                            <p className={classNames("whitespace-pre-wrap break-words px-3 py-1.5 text-[13px] leading-snug", mine ? "text-white" : "text-ink-100")}>
                              <span>{m.body}</span>
                              <span className={classNames(
                                "inline-block ml-1.5 translate-y-[1px] text-[10px] leading-none whitespace-nowrap",
                                mine ? "text-white/60" : "text-ink-500"
                              )}>
                                {timeAgo(m.created_at)}{mine && m.read_at ? " · read" : ""}
                              </span>
                            </p>
                          )}
                          {m.image_url && !m.body && (
                            <span className={classNames(
                              "block px-2 pb-1.5 text-[10px] leading-none whitespace-nowrap",
                              mine ? "text-white/60 text-right" : "text-ink-500"
                            )}>
                              {timeAgo(m.created_at)}{mine && m.read_at ? " · read" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="flex flex-col gap-2 p-3 border-t border-ink-800 bg-ink-900/30">
                {pendingImage && (
                  <div className="flex items-start gap-2 rounded-lg border border-ink-700 bg-ink-800/50 p-2">
                    <img src={pendingImage} alt="Preview" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs text-ink-300 truncate">Image ready to send</p>
                      <p className="text-[10px] text-ink-500 mt-0.5">Add a caption below or send as-is.</p>
                    </div>
                    <button type="button" onClick={clearPendingImage} className="shrink-0 rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-700 hover:text-ink-200" aria-label="Remove image">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChosen}
                    className="hidden"
                  />
                  {iAmSeller && (
                  <button
                    type="button"
                    onClick={openOfferModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary-500/40 bg-primary-500/10 px-3 py-2 text-sm font-semibold text-primary-300 transition-colors hover:bg-primary-500/20"
                    title="Give the buyer a discounted offer"
                  >
                    <HandCoins size={18} />
                    <span className="hidden sm:inline">Give Offer</span>
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={onPickImage}
                    disabled={uploadingImage || sending}
                    className="inline-flex items-center justify-center rounded-xl border border-ink-700 bg-ink-800/50 px-2.5 py-2 text-ink-300 transition-colors hover:border-primary-500/40 hover:text-primary-300 disabled:opacity-50"
                    title="Attach image"
                    aria-label="Attach image"
                  >
                    {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  </button>
                  <input
                    ref={draftRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={pendingImage ? "Add a caption (optional)..." : "Type a message..."}
                    className="input flex-1"
                  />
                  <button type="submit" disabled={sending || uploadingImage || (!draft.trim() && !pendingFile)} className="btn-primary px-4" aria-label="Send message">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {!profile?.full_name && (
        <p className="text-xs text-ink-500 mt-4 text-center">Tip: complete your <Link to="/profile" className="text-primary-400">profile</Link> so sellers recognize you in chats.</p>
      )}

      {/* ===== Make an Offer Modal ===== */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={closeOfferModal}>
          <div
            className="card w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-ink-800 sticky top-0 bg-ink-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-2">
                {selectedListing && (
                  <button type="button" onClick={() => setSelectedListing(null)} className="btn-ghost p-1 -ml-1"><ArrowLeft size={16} /></button>
                )}
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Give an Offer</h3>
                  <p className="text-xs text-ink-400">{selectedListing ? "Set your discounted price" : "Pick one of your listings"}</p>
                </div>
              </div>
              <button type="button" onClick={closeOfferModal} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            {offerError && <div className="mx-4 mt-3 rounded-lg bg-error-500/10 border border-error-500/20 p-2.5 text-sm text-error-400">{offerError}</div>}

            {!selectedListing ? (
              <div className="p-4">
                {loadingListings ? (
                  <div className="grid place-items-center py-10"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
                ) : sellerListings.length === 0 ? (
                  <div className="py-10 text-center">
                    <Tag size={32} className="mx-auto text-ink-600" />
                    <p className="text-sm text-ink-400 mt-2">You have no active listings right now.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sellerListings.map((li) => (
                      <button
                        key={li.id}
                        type="button"
                        onClick={() => selectListing(li)}
                        className="flex w-full items-center gap-3 rounded-xl border border-ink-700 bg-ink-800/50 p-2.5 text-left transition-all hover:border-primary-500/50 hover:bg-ink-800"
                      >
                        <img
                          src={li.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=200"}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{li.title}</p>
                          <p className="text-xs text-ink-400 flex items-center gap-1"><Tag size={10} /> {li.game_name}</p>
                        </div>
                        <span className="font-display font-bold text-primary-400 shrink-0">{formatBDT(li.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendOffer} className="p-4 space-y-4">
                {/* Selected listing details */}
                <div className="rounded-xl border border-ink-700 bg-ink-800/50 p-3">
                  <div className="flex gap-3">
                    <img
                      src={selectedListing.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=300"}
                      alt={selectedListing.title}
                      className="h-20 w-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="badge glass text-white text-[10px]"><Tag size={10} /> {selectedListing.game_name}</span>
                      <p className="font-semibold text-white mt-1.5 leading-snug">{selectedListing.title}</p>
                      <p className="text-sm text-ink-400 mt-1">Listed price</p>
                      <p className="font-display text-xl font-extrabold text-white">{formatBDT(selectedListing.price)}</p>
                    </div>
                  </div>
                </div>

                {/* Offer price input */}
                <div>
                  <label className="label">Discounted Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display font-bold text-primary-400">৳</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value.replace(/[^0-9]/g, ""))}
                      className="input pl-8 text-lg font-semibold"
                      autoFocus
                    />
                  </div>
                  {offerPrice && parseFloat(offerPrice) > 0 && (
                    <p className="text-xs text-ink-400 mt-2">
                      Buyer saves <span className="text-success-400 font-semibold">{formatBDT(selectedListing.price - parseFloat(offerPrice))}</span> off the listed price.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sendingOffer || !offerPrice || parseFloat(offerPrice) <= 0}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {sendingOffer ? <Loader2 size={18} className="animate-spin" /> : <><HandCoins size={18} /> Send Offer</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== Image Lightbox ===== */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 inline-grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close image"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxSrc}
            alt="Chat image"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] rounded-xl object-contain shadow-2xl animate-scale-in"
          />
        </div>
      )}
    </div>
  );
}

// ===== Offer card rendered inline in the chat thread =====
function OfferBubble({
  mine, message, userId,
}: {
  mine: boolean;
  message: Message;
  userId: string;
}) {
  const offer = message.offer!;
  const isBuyer = offer.buyer_id === userId;
  const isSeller = offer.seller_id === userId;
  const listing = offer.listing;
  const img = listing?.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=300";
  const originalPrice = listing?.price ?? 0;
  const savings = originalPrice - offer.offer_price;

  const statusStyles: Record<OfferStatus, string> = {
    pending: "bg-warning-500/15 text-warning-400 border-warning-500/20",
    accepted: "bg-primary-500/15 text-primary-300 border-primary-500/20",
    declined: "bg-ink-700 text-ink-400 border-ink-600",
    paid: "bg-success-500/15 text-success-400 border-success-500/20",
    expired: "bg-ink-700 text-ink-400 border-ink-600",
  };
  const statusLabel: Record<OfferStatus, string> = {
    pending: "Pending", accepted: "Accepted", declined: "Declined", paid: "Paid", expired: "Expired",
  };

  return (
    <div className={classNames("flex", mine ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%] w-[300px] rounded-2xl overflow-hidden border border-primary-500/30 bg-ink-900 shadow-lg" style={{ backgroundColor: "#1C1C22" }}>
        {/* Header strip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-300 text-[11px] font-semibold">
          <HandCoins size={12} />
          <span>OFFER</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-500 font-normal">{timeAgo(message.created_at)}</span>
        </div>

        {/* Listing summary */}
        <div className="flex gap-2.5 p-3">
          {img ? (
            <img src={img} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-ink-800 text-ink-600 shrink-0"><ImageIcon size={20} /></div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-snug">{listing?.title ?? "Listing"}</p>
            {listing?.game_name && <p className="text-[11px] text-ink-400 mt-0.5">{listing.game_name}</p>}
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs text-ink-500 line-through">{formatBDT(originalPrice)}</span>
              <span className="font-display text-lg font-extrabold text-primary-400">{formatBDT(offer.offer_price)}</span>
            </div>
          </div>
        </div>

        {/* Status + actions */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className={classNames("badge border text-[10px]", statusStyles[offer.status])}>{statusLabel[offer.status]}</span>
            {savings > 0 && offer.status !== "declined" && (
              <span className="text-[11px] text-success-400 font-medium">Save {formatBDT(savings)}</span>
            )}
          </div>

          {offer.status === "pending" && isBuyer && (
            <Link
              to={`/checkout/${offer.listing_id}?offer=${offer.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-400"
            >
              <ShoppingBag size={16} /> Pay {formatBDT(offer.offer_price)}
            </Link>
          )}
          {offer.status === "pending" && isSeller && (
            <p className="text-center text-[11px] text-ink-500 py-1.5">Waiting for the buyer to pay…</p>
          )}
          {offer.status === "paid" && (
            <p className="text-center text-[11px] text-success-400 py-1.5 font-medium">Payment completed — order placed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
