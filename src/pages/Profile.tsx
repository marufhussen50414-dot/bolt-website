import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, Wallet, Star, ShieldCheck, Edit3, Save, X, Loader2,
  TrendingUp, ShoppingBag, Tag, Package, CheckCircle2, CreditCard, Calendar,
  Award, Activity, Lock, Heart, Trophy, Target,
  BarChart3, Clock, Crown, Flame, Sparkles, BadgeCheck, Mail,
  AlertCircle, HelpCircle, LifeBuoy, FileText, ScrollText, Trash2, AlertTriangle
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Order, Review } from "../lib/types";
import { formatBDT, timeAgo, classNames, IconType } from "../lib/utils";
import { StatusBadge } from "../components/ListingCard";

type Tab = "overview" | "payment" | "security" | "activity" | "reviews" | "wishlist" | "achievements" | "insights" | "verify";

export default function Profile() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [myListings, setMyListings] = useState<GameListing[]>([]);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "", location: "", phone: "", avatar_url: "" });
  
  // Payment payout state
  const [paymentForm, setPaymentForm] = useState({ bkash_number: "", nagad_number: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [verifyRequested, setVerifyRequested] = useState(false);

  // Confirmation Modal State for Listings actions (Active/Inactive and Delete only)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: "status" | "delete" | null;
    listing: GameListing | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    actionType: null,
    listing: null,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [listRes, buyRes, sellRes, revRes] = await Promise.all([
        supabase.from("game_listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, listing:game_listings(*)").eq("buyer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, listing:game_listings(*)").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*, reviewer:profiles(full_name, username)").eq("reviewee_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setMyListings((listRes.data as GameListing[]) ?? []);
      setBuyOrders((buyRes.data as Order[]) ?? []);
      setSellOrders((sellRes.data as Order[]) ?? []);
      setReviews((revRes.data as Review[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({ full_name: profile.full_name ?? "", bio: profile.bio ?? "", location: profile.location ?? "", phone: profile.phone ?? "", avatar_url: profile.avatar_url ?? "" });
      setPaymentForm({ bkash_number: profile.bkash_number ?? "", nagad_number: profile.nagad_number ?? "" });
    }
  }, [profile]);

  if (authLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!user) return <div className="mx-auto max-w-md py-16 text-center"><div className="card p-8"><h2 className="font-display text-xl font-bold text-white">Log in to view your profile</h2><Link to="/login?redirect=/profile" className="btn-primary mt-5 inline-flex">Log In</Link></div></div>;

  const displayName = profile?.full_name ?? profile?.username ?? "Player";
  const initials = displayName.trim()[0]?.toUpperCase() ?? "U";
  const completedSales = sellOrders.filter((o) => o.status === "completed");
  const totalEarnings = completedSales.reduce((s, o) => s + o.seller_amount, 0);
  const activeListings = myListings.filter((l) => l.status === "active" || l.status === "approved");
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Profile completion calculation
  const completionFields = [profile?.full_name, profile?.bio, profile?.avatar_url, profile?.location, profile?.phone];
  const filledCount = completionFields.filter(Boolean).length;
  const completionPct = Math.round((filledCount / completionFields.length) * 100);

  // Achievement badges (derived from real data)
  const achievements = [
    { id: "first-sale", icon: Trophy, title: "First Sale", desc: "Completed your first sale", unlocked: completedSales.length >= 1, color: "text-accent-400 bg-accent-500/15" },
    { id: "ten-sales", icon: Crown, title: "Top Seller", desc: "10 completed sales", unlocked: completedSales.length >= 10, color: "text-warning-400 bg-warning-500/15" },
    { id: "five-star", icon: Star, title: "Five Star", desc: "Received a 5-star review", unlocked: reviews.some((r) => r.rating === 5), color: "text-success-400 bg-success-500/15" },
    { id: "verified", icon: BadgeCheck, title: "Verified", desc: "Verified seller badge", unlocked: profile?.is_verified ?? false, color: "text-primary-400 bg-primary-500/15" },
    { id: "active", icon: Flame, title: "Active Lister", desc: "5+ active listings", unlocked: activeListings.length >= 5, color: "text-error-400 bg-error-500/15" },
    { id: "buyer", icon: ShoppingBag, title: "First Buy", desc: "Made your first purchase", unlocked: buyOrders.length >= 1, color: "text-primary-400 bg-primary-500/15" },
    { id: "trusted", icon: ShieldCheck, title: "Trusted", desc: "Trust score above 4.0", unlocked: Number(profile?.trust_score ?? 0) >= 4, color: "text-success-400 bg-success-500/15" },
    { id: "veteran", icon: Award, title: "Veteran", desc: "Member for 30+ days", unlocked: Date.now() - new Date(profile?.created_at ?? Date.now()).getTime() > 30 * 24 * 3600 * 1000, color: "text-accent-400 bg-accent-500/15" },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Wishlist (mocked — saved listings for this user)
  const wishlist = myListings.filter((l) => l.is_featured).slice(0, 4);

  // Seller insights
  const monthlyEarnings = completedSales.filter((o) => new Date(o.created_at).getMonth() === new Date().getMonth()).reduce((s, o) => s + o.seller_amount, 0);
  const avgOrderValue = completedSales.length ? totalEarnings / completedSales.length : 0;
  const responseRate = profile?.response_rate ?? 0;
  const maxBars = 7;
  const weeklyData = Array.from({ length: maxBars }, (_, i) => {
    const day = new Date(); day.setDate(day.getDate() - (maxBars - 1 - i));
    return completedSales.filter((o) => new Date(o.created_at).toDateString() === day.toDateString()).length;
  });
  const maxWeekly = Math.max(...weeklyData, 1);

  // Tabs configuration
  const tabs: { id: Tab; label: string; icon: IconType }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "achievements", label: "Badges", icon: Trophy },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "verify", label: "Verification", icon: BadgeCheck },
    { id: "activity", label: "Activity", icon: TrendingUp },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "security", label: "Security", icon: Lock },
  ];

  function updateEdit(k: keyof typeof editForm, v: string) { setEditForm((f) => ({ ...f, [k]: v })); }

  async function handleAvatarUpload(file: File) {
    if (!user) return;
    setUploading(true); setSaveMsg("");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: false });
    setUploading(false);
    if (error) { setSaveMsg("Upload failed: " + error.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    updateEdit("avatar_url", pub.publicUrl);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault(); setSaving(true); setSaveMsg("");
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name.trim(), bio: editForm.bio.trim() || null,
      location: editForm.location.trim() || null, phone: editForm.phone.trim() || null,
      avatar_url: editForm.avatar_url.trim() || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) setSaveMsg("Failed to save: " + error.message);
    else { setSaveMsg("Profile updated successfully!"); await refreshProfile(); setTimeout(() => { setSaveMsg(""); setEditOpen(false); }, 2500); }
  }

  async function handleSavePayment(e: FormEvent) {
    e.preventDefault(); setSavingPayment(true); setPaymentMsg("");
    const { error } = await supabase.from("profiles").update({
      bkash_number: paymentForm.bkash_number.trim() || null,
      nagad_number: paymentForm.nagad_number.trim() || null,
    }).eq("id", user!.id);
    setSavingPayment(false);
    if (error) setPaymentMsg("Failed to save payout info: " + error.message);
    else { setPaymentMsg("Payout numbers saved successfully!"); await refreshProfile(); setTimeout(() => setPaymentMsg(""), 3000); }
  }

  // Open Confirmation Modal triggers (No modal for Edit, direct navigation)
  function promptToggleStatus(listing: GameListing, e: React.MouseEvent) {
    e.stopPropagation();
    const isActive = listing.status === "active" || listing.status === "approved";
    setConfirmModal({
      isOpen: true,
      title: isActive ? "Deactivate Listing?" : "Activate Listing?",
      message: isActive 
        ? `Are you sure you want to deactivate "${listing.title}"?` 
        : `Are you sure you want to activate "${listing.title}"?`,
      actionType: "status",
      listing,
    });
  }

  function handleEditListing(listing: GameListing, e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/edit-listing/${listing.id}`);
  }

  function promptDeleteListing(listing: GameListing, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete Listing?",
      message: `Are you sure you want to permanently delete "${listing.title}"?`,
      actionType: "delete",
      listing,
    });
  }

  // Execute confirmed action
  async function executeConfirmedAction() {
    if (!confirmModal.listing || !confirmModal.actionType) return;
    const l = confirmModal.listing;

    if (confirmModal.actionType === "status") {
      const isActive = l.status === "active" || l.status === "approved";
      const newStatus = (isActive ? "pending" : "active") as any;
      const { error } = await supabase.from("game_listings").update({ status: newStatus }).eq("id", l.id);
      if (!error) {
        setMyListings(myListings.map(item => item.id === l.id ? { ...item, status: newStatus } : item));
      }
    } else if (confirmModal.actionType === "delete") {
      const { error } = await supabase.from("game_listings").delete().eq("id", l.id);
      if (!error) {
        setMyListings(myListings.filter(item => item.id !== l.id));
      }
    }

    setConfirmModal({ isOpen: false, title: "", message: "", actionType: null, listing: null });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Profile Header Banner */}
      <div className="card overflow-hidden mb-6 border border-ink-800 shadow-2xl bg-ink-900">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-primary-900/70 via-ink-800 to-accent-950/70 relative">
          <div className="absolute inset-0 bg-grid-pattern bg-[size:28px_28px] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="relative group">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-ink-900 shadow-2xl bg-ink-800" />
                ) : (
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white text-4xl font-extrabold border-4 border-ink-900 shadow-2xl">
                    {initials}
                  </div>
                )}
                <span className={classNames("absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-ink-900 shadow-md", profile?.is_online ? "bg-success-400" : "bg-ink-500")} />
              </div>

              <div className="pt-2 sm:pt-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{displayName}</h1>
                  {profile?.is_verified && (
                    <span className="badge bg-success-500/15 text-success-400 border border-success-500/20 px-2.5 py-1 text-xs flex items-center gap-1 font-semibold shadow-sm">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  )}
                  {unlockedCount >= 3 && (
                    <span className="badge bg-accent-500/15 text-accent-300 border border-accent-500/20 px-2.5 py-1 text-xs flex items-center gap-1 font-semibold shadow-sm">
                      <Trophy size={14} /> {unlockedCount} Badges
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-400 mt-0.5 font-medium">{user.email}</p>
              </div>
            </div>

            <button 
              onClick={() => setEditOpen(true)} 
              className="btn-primary self-start sm:self-auto px-5 py-2.5 shadow-lg flex items-center gap-2 text-sm font-semibold transition-transform hover:scale-[1.02]"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-ink-800/80">
            <div className="flex items-center gap-4 text-xs sm:text-sm text-ink-300 flex-wrap">
              {profile?.location && (
                <span className="flex items-center gap-1.5 bg-ink-800/60 px-3.5 py-1.5 rounded-xl border border-ink-700/50 shadow-inner">
                  <MapPin size={14} className="text-primary-400" /> {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-ink-800/60 px-3.5 py-1.5 rounded-xl border border-ink-700/50 shadow-inner">
                <Calendar size={14} className="text-accent-400" /> Joined {timeAgo(profile?.created_at ?? new Date())}
              </span>
              <span className="flex items-center gap-1.5 bg-ink-800/60 px-3.5 py-1.5 rounded-xl border border-ink-700/50 shadow-inner">
                <Star size={14} className="text-warning-400 fill-warning-400" /> {avgRating.toFixed(1)} Rating
              </span>
            </div>

            {profile?.bio ? (
              <p className="text-sm text-ink-300 leading-relaxed max-w-3xl bg-ink-950/40 p-4 rounded-xl border border-ink-800/60">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-ink-500 italic">No bio added yet. Click 'Edit Profile' to add one.</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      {completionPct < 100 && (
        <div className="card p-5 mb-6 border-primary-500/20 bg-gradient-to-r from-ink-900 to-primary-950/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 text-ink-200 font-semibold"><Sparkles size={14} className="text-primary-400" /> Profile Completion</span>
            <span className="font-bold text-primary-300">{completionPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-ink-800 overflow-hidden shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
          <p className="text-xs text-ink-400 mt-2.5">
            Complete your profile details to maximize buyer trust and visibility. <button onClick={() => setEditOpen(true)} className="text-primary-400 font-semibold hover:underline">Complete now →</button>
          </p>
        </div>
      )}

      {/* Your Listings Section with Modal Confirmation */}
      <div className="card p-5 mb-6 border border-ink-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Package size={18} className="text-primary-400" /> Your Listings
          </h3>
          <Link to="/my-listings" className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors">View all →</Link>
        </div>
        {myListings.slice(0, 3).length > 0 ? (
          <div className="space-y-3">
            {myListings.slice(0, 3).map((l) => {
              const isActive = l.status === "active" || l.status === "approved";
              return (
                <div 
                  key={l.id} 
                  onClick={() => navigate(`/listing/${l.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-ink-700/60 hover:border-primary-500/40 hover:bg-ink-800/60 transition-all cursor-pointer shadow-sm bg-ink-900/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-ink-800 overflow-hidden shrink-0 border border-ink-700/40">
                      {l.images?.[0] && <img src={l.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white hover:text-primary-400 line-clamp-1 text-sm">{l.title}</p>
                      <p className="font-semibold text-primary-400 text-sm mt-0.5">{formatBDT(l.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-ink-800">
                    {/* 1. Active / Inactive Button with Confirmation Modal */}
                    <button
                      type="button"
                      onClick={(e) => promptToggleStatus(l, e)}
                      title="Toggle Active Status"
                      className={classNames(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        isActive 
                          ? "bg-success-500/15 text-success-400 border-success-500/30 hover:bg-success-500/25" 
                          : "bg-ink-800 text-ink-400 border-ink-700 hover:bg-ink-700 hover:text-white"
                      )}
                    >
                      <span className={classNames("h-2 w-2 rounded-full", isActive ? "bg-success-400 animate-pulse" : "bg-ink-500")} />
                      <input 
                        type="radio" 
                        checked={isActive} 
                        readOnly 
                        className="accent-success-500 cursor-pointer h-3 w-3" 
                      />
                      <span>{isActive ? "Active" : "Inactive"}</span>
                    </button>

                    {/* 2. Edit Button (Direct Navigation, No Modal) */}
                    <button
                      type="button"
                      onClick={(e) => handleEditListing(l, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500/15 text-primary-400 border border-primary-500/30 hover:bg-primary-500/25 transition-all"
                      title="Edit Listing"
                    >
                      <Edit3 size={13} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* 3. Delete Button with Confirmation Modal */}
                    <button
                      type="button"
                      onClick={(e) => promptDeleteListing(l, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-error-500/15 text-error-400 border border-error-500/30 hover:bg-error-500/25 transition-all"
                      title="Delete Listing"
                    >
                      <Trash2 size={13} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink-400">
            No listings yet. <Link to="/sell" className="text-primary-400 font-medium hover:underline">Create one →</Link>
          </p>
        )}
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Tag} value={String(activeListings.length)} label="Active Listings" color="text-accent-400 bg-accent-500/15 border border-accent-500/20" />
        <StatCard icon={Award} value={Number(profile?.trust_score ?? 0).toFixed(1)} label="Trust Score" color="text-warning-400 bg-warning-500/15 border border-warning-500/20" />
        <StatCard icon={Package} value={String(profile?.total_sales ?? completedSales.length)} label="Total IDs Sold" color="text-success-400 bg-success-500/15 border border-success-500/20" />
        <StatCard icon={ShoppingBag} value={String(profile?.total_purchases ?? buyOrders.length)} label="Total IDs Bought" color="text-primary-400 bg-primary-500/15 border border-primary-500/20" />
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 border-b border-ink-800 mb-6 overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={classNames("flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-all whitespace-nowrap", tab === t.id ? "border-primary-500 text-primary-400 bg-primary-500/5" : "border-transparent text-ink-400 hover:text-white")}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-primary-500" size={28} /></div> : (
        <>
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="card p-6 border border-ink-800 shadow-xl">
              <h3 className="font-semibold text-white mb-5 flex items-center gap-2"><Activity size={18} className="text-primary-400" /> Account Summary</h3>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <Row icon={Tag} label="Total Listings" value={String(myListings.length)} />
                <Row icon={Package} label="Items Sold" value={String(profile?.total_sales ?? completedSales.length)} />
                <Row icon={ShoppingBag} label="Purchases" value={String(profile?.total_purchases ?? buyOrders.length)} />
                <Row icon={Star} label="Reviews Received" value={String(reviews.length)} />
                <Row icon={TrendingUp} label="Response Rate" value={`${responseRate}%`} />
                <Row icon={Trophy} label="Badges Earned" value={`${unlockedCount}/${achievements.length}`} />
              </dl>
            </div>
          )}

          {/* PAYMENT */}
          {tab === "payment" && (
            <div className="card p-6 max-w-2xl space-y-5 border border-ink-800 shadow-xl">
              <div className="flex items-center gap-2 text-white font-semibold text-lg"><Wallet size={20} className="text-success-400" /> Seller Payout Information</div>
              <div className="space-y-1.5 bg-ink-950/40 p-4 rounded-xl border border-ink-800/60">
                <p className="text-sm text-ink-200 font-medium">
                  These numbers are strictly for sellers to receive payments after selling an ID.
                </p>
                <p className="text-xs text-ink-400 font-normal">
                  (এই নম্বরগুলো শুধুমাত্র সেলারদের জন্য। আইডি বিক্রির পর আপনি কোন নম্বরে টাকা নিতে চান, তা এখানে সেট করুন।)
                </p>
              </div>
              
              <form onSubmit={handleSavePayment} className="space-y-4">
                {paymentMsg && (
                  <div className={classNames("flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium shadow-md animate-fade-in", paymentMsg.includes("success") ? "bg-success-500/10 text-success-400 border border-success-500/20" : "bg-error-500/10 text-error-400 border border-error-500/20")}>
                    {paymentMsg.includes("success") ? <CheckCircle2 size={18} /> : <X size={18} />} {paymentMsg}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label font-medium text-xs text-ink-300">BKash Number (Seller)</label>
                    <input 
                      value={paymentForm.bkash_number} 
                      onChange={(e) => setPaymentForm((f) => ({ ...f, bkash_number: e.target.value }))} 
                      className="input mt-1.5" 
                      placeholder="01XXXXXXXXX" 
                    />
                  </div>
                  <div>
                    <label className="label font-medium text-xs text-ink-300">Nagad Number (Seller)</label>
                    <input 
                      value={paymentForm.nagad_number} 
                      onChange={(e) => setPaymentForm((f) => ({ ...f, nagad_number: e.target.value }))} 
                      className="input mt-1.5" 
                      placeholder="01XXXXXXXXX" 
                    />
                  </div>
                </div>
                <button type="submit" disabled={savingPayment} className="btn-primary w-full sm:w-auto px-6 py-2.5">
                  {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Payout Info
                </button>
              </form>
            </div>
          )}

          {/* ACHIEVEMENTS / BADGES */}
          {tab === "achievements" && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-display text-xl font-bold text-white">Achievements</h2>
                <span className="badge bg-accent-500/15 text-accent-300 border border-accent-500/20 px-3 py-1 font-semibold"><Trophy size={14} /> {unlockedCount} unlocked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {achievements.map((a) => (
                  <div key={a.id} className={classNames("card p-5 text-center transition-all border border-ink-800 shadow-lg", a.unlocked ? "border-primary-500/30 bg-ink-900/90" : "opacity-50 grayscale")}>
                    <div className={classNames("inline-grid place-items-center h-14 w-14 rounded-2xl mx-auto shadow-inner", a.color)}><a.icon size={26} /></div>
                    <p className="font-semibold text-white text-sm mt-3">{a.title}</p>
                    <p className="text-xs text-ink-400 mt-1">{a.desc}</p>
                    {a.unlocked ? <span className="badge bg-success-500/15 text-success-400 border border-success-500/20 mt-3 px-2.5 py-0.5"><CheckCircle2 size={11} /> Earned</span> : <span className="badge bg-ink-800 text-ink-500 border border-ink-700 mt-3 px-2.5 py-0.5"><Lock size={11} /> Locked</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WISHLIST */}
          {tab === "wishlist" && (
            <div>
              <div className="flex items-center gap-3 mb-5"><h2 className="font-display text-xl font-bold text-white">Wishlist</h2><span className="badge bg-primary-500/15 text-primary-300 border border-primary-500/20 px-3 py-1 font-semibold"><Heart size={14} /> {wishlist.length} saved</span></div>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {wishlist.map((l) => (
                    <Link key={l.id} to={`/listing/${l.id}`} className="card-hover overflow-hidden block group border border-ink-800 shadow-lg">
                      <div className="h-36 overflow-hidden"><img src={l.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=400"} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" /></div>
                      <div className="p-3.5"><p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">{l.title}</p><p className="font-display font-extrabold text-primary-400 mt-1 text-base">{formatBDT(l.price)}</p></div>
                    </Link>
                  ))}
                </div>
              ) : <div className="card p-12 text-center border border-ink-800 shadow-xl"><Heart size={40} className="mx-auto text-ink-600 mb-2" /><p className="text-ink-400 font-medium">No saved items yet.</p><Link to="/browse" className="btn-primary mt-4 inline-flex px-5 py-2">Browse to save</Link></div>}
            </div>
          )}

          {/* SELLER INSIGHTS */}
          {tab === "insights" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold text-white">Seller Insights</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Wallet} value={formatBDT(monthlyEarnings)} label="This Month" color="text-success-400 bg-success-500/15 border border-success-500/20" />
                <StatCard icon={TrendingUp} value={formatBDT(avgOrderValue)} label="Avg Order" color="text-primary-400 bg-primary-500/15 border border-primary-500/20" />
                <StatCard icon={Target} value={String(completedSales.length)} label="Total Sales" color="text-accent-400 bg-accent-500/15 border border-accent-500/20" />
                <StatCard icon={Clock} value={`${responseRate}%`} label="Response Rate" color="text-warning-400 bg-warning-500/15 border border-warning-500/20" />
              </div>
              <div className="card p-6 border border-ink-800 shadow-xl">
                <h3 className="font-semibold text-white mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-primary-400" /> Sales — Last 7 Days</h3>
                <div className="flex items-end gap-3 h-44 pt-2">
                  {weeklyData.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full rounded-t-xl bg-gradient-to-t from-primary-600 to-primary-400 transition-all hover:from-primary-500 hover:to-primary-300 shadow-md" style={{ height: `${(v / maxWeekly) * 100}%`, minHeight: "8px" }} title={`${v} sales`} />
                      <span className="text-xs font-semibold text-ink-400">{new Date(Date.now() - (maxBars - 1 - i) * 86400000).toLocaleDateString("en", { weekday: "short" }).charAt(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6 border border-ink-800 shadow-xl">
                <h3 className="font-semibold text-white mb-5">Performance Breakdown</h3>
                <div className="space-y-4">
                  {[{ label: "Delivery Speed", value: 85, color: "from-success-500 to-success-400" }, { label: "Communication", value: 72, color: "from-primary-500 to-primary-400" }, { label: "Account Quality", value: 90, color: "from-accent-500 to-accent-400" }, { label: "Dispute Rate", value: 95, color: "from-warning-500 to-warning-400" }].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-sm mb-1.5"><span className="text-ink-300 font-medium">{m.label}</span><span className="font-bold text-white">{m.value}%</span></div>
                      <div className="h-2.5 rounded-full bg-ink-800 overflow-hidden shadow-inner"><div className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`} style={{ width: `${m.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VERIFICATION */}
          {tab === "verify" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><BadgeCheck size={22} className="text-success-400" /> Seller Verification</h2>
              {profile?.is_verified ? (
                <div className="card p-8 text-center bg-success-500/10 border-success-500/30 shadow-xl">
                  <ShieldCheck size={52} className="mx-auto text-success-400 mb-2 animate-bounce" />
                  <h3 className="font-display text-xl font-bold text-white mt-2">You're Verified!</h3>
                  <p className="text-sm text-ink-300 mt-1 max-w-md mx-auto">Your account carries the verified badge. Buyers trust you more and your listings rank higher.</p>
                </div>
              ) : verifyRequested ? (
                <div className="card p-8 text-center bg-primary-500/10 border-primary-500/30 shadow-xl">
                  <Clock size={52} className="mx-auto text-primary-400 mb-2 animate-pulse" />
                  <h3 className="font-display text-xl font-bold text-white mt-2">Request Submitted</h3>
                  <p className="text-sm text-ink-300 mt-1 max-w-md mx-auto">Our administration team is reviewing your verification request. You'll be notified within 48 hours.</p>
                </div>
              ) : (
                <div className="card p-6 space-y-5 border border-ink-800 shadow-xl">
                  <div className="flex items-start gap-3 rounded-xl bg-primary-500/10 border border-primary-500/25 p-4 text-xs sm:text-sm text-primary-200">
                    <AlertCircle size={20} className="shrink-0 mt-0.5 text-primary-400" />
                    <span>Verification gives you a green checkmark badge, builds high buyer confidence, and optimizes your account positioning. Requires at least 3 completed sales and a 4.0+ trust score.</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3 text-sm">Requirements Checklist</h3>
                    <div className="space-y-2.5 bg-ink-950/40 p-4 rounded-xl border border-ink-800/60">
                      <VerifyReq done={completedSales.length >= 3} label={`3 completed sales (you have ${completedSales.length})`} />
                      <VerifyReq done={Number(profile?.trust_score ?? 0) >= 4} label={`Trust score 4.0+ (yours: ${Number(profile?.trust_score ?? 0).toFixed(1)})`} />
                      <VerifyReq done={!!profile?.phone} label="Phone number added" />
                      <VerifyReq done={!!profile?.full_name} label="Full name set" />
                    </div>
                  </div>
                  <button onClick={() => setVerifyRequested(true)} className="btn-primary w-full py-3 font-semibold shadow-lg" disabled={completedSales.length < 3 || Number(profile?.trust_score ?? 0) < 4}>
                    <BadgeCheck size={18} /> Request Verification
                  </button>
                  {completedSales.length < 3 && <p className="text-xs text-ink-500 text-center">Complete more sales to unlock verification eligibility.</p>}
                </div>
              )}
            </div>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <div className="card p-6 max-w-2xl space-y-4 border border-ink-800 shadow-xl">
              <div className="flex items-center gap-2 text-white font-semibold text-lg"><Lock size={20} className="text-primary-400" /> Security & Privacy</div>
              <div className="rounded-xl bg-ink-950/40 p-4 border border-ink-800/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Email verified</p>
                  <p className="text-xs text-ink-400 mt-0.5">{user.email}</p>
                </div>
                <span className="badge bg-success-500/15 text-success-400 border border-success-500/20 px-3 py-1 font-semibold"><Mail size={13} /> Verified</span>
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === "activity" && (
            <div className="space-y-6">
              <div className="card p-5 border border-ink-800 shadow-xl"><h3 className="font-semibold text-white mb-3 text-base">Recent Sales</h3>{sellOrders.slice(0, 5).length > 0 ? <div className="space-y-2.5">{sellOrders.slice(0, 5).map((o) => <OrderMiniRow key={o.id} order={o} role="seller" />)}</div> : <p className="text-sm text-ink-400 py-2">No sales recorded yet.</p>}</div>
              <div className="card p-5 border border-ink-800 shadow-xl"><h3 className="font-semibold text-white mb-3 text-base">Recent Purchases</h3>{buyOrders.slice(0, 5).length > 0 ? <div className="space-y-2.5">{buyOrders.slice(0, 5).map((o) => <OrderMiniRow key={o.id} order={o} role="buyer" />)}</div> : <p className="text-sm text-ink-400 py-2">No purchases recorded yet.</p>}</div>
            </div>
          )}

          {/* REVIEWS */}
          {tab === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-semibold text-white text-base">Reviews About You</h3>
                <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/20 px-3 py-1 font-semibold"><Star size={13} className="fill-warning-400" /> {avgRating.toFixed(1)} ({reviews.length})</span>
              </div>
              {reviews.length > 0 ? reviews.map((r) => (
                <div key={r.id} className="card p-4 border border-ink-800 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-ink-800 border border-ink-700/50 text-ink-200 text-sm font-bold">{(r.reviewer?.full_name ?? r.reviewer?.username)?.[0]?.toUpperCase() ?? "?"}</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{r.reviewer?.full_name ?? r.reviewer?.username ?? "Anonymous"}</p>
                      <div className="flex items-center gap-2 mt-0.5"><div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-warning-400 fill-warning-400" : "text-ink-700"} />)}</div><span className="text-xs text-ink-500">• {timeAgo(r.created_at)}</span></div>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-ink-300 mt-3 bg-ink-950/30 p-3 rounded-xl border border-ink-800/40">{r.comment}</p>}
                </div>
              )) : <div className="card p-10 text-center border border-ink-800 shadow-xl"><Star size={36} className="mx-auto text-ink-600 mb-2" /><p className="text-sm text-ink-400">No reviews yet. Complete some sales to build your rating profile!</p></div>}
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal (No on left, Yes on right, fully English) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", actionType: null, listing: null })}>
          <div className="card w-full max-w-md p-6 shadow-2xl border border-ink-700 bg-ink-900 animate-scale-in text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-ink-300 mb-6">{confirmModal.message}</p>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", actionType: null, listing: null })} 
                className="btn-secondary flex-1 py-2.5 font-semibold bg-ink-800 hover:bg-ink-700 text-ink-200"
              >
                No
              </button>
              <button 
                type="button" 
                onClick={executeConfirmedAction} 
                className="btn-primary flex-1 py-2.5 font-semibold bg-success-600 hover:bg-success-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setEditOpen(false)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-ink-700 bg-ink-900 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2"><Edit3 size={18} className="text-primary-400" /> Edit Your Profile</h2>
              <button onClick={() => setEditOpen(false)} className="text-ink-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {saveMsg && <div className={classNames("flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium shadow-md", saveMsg.includes("success") ? "bg-success-500/10 text-success-400 border border-success-500/20" : "bg-error-500/10 text-error-400 border border-error-500/20")}>{saveMsg.includes("success") ? <CheckCircle2 size={16} /> : <X size={16} />} {saveMsg}</div>}
              <div className="flex items-center gap-4 bg-ink-950/40 p-4 rounded-xl border border-ink-800/60">
                {editForm.avatar_url ? <img src={editForm.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover border border-ink-700" /> : <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white text-xl font-bold">{initials}</div>}
                <div className="flex-1">
                  <label className="label text-xs font-semibold text-ink-300">Profile Picture</label>
                  <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} className="block w-full text-xs text-ink-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500 file:text-white file:font-semibold hover:file:bg-primary-600 file:cursor-pointer cursor-pointer mt-1" />
                  {uploading && <p className="text-xs text-primary-400 mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading image...</p>}
                </div>
              </div>
              <div><label className="label font-medium text-xs text-ink-300">Full Name</label><input value={editForm.full_name} onChange={(e) => updateEdit("full_name", e.target.value)} className="input mt-1" required /></div>
              <div><label className="label font-medium text-xs text-ink-300">Bio</label><textarea value={editForm.bio} onChange={(e) => updateEdit("bio", e.target.value)} rows={3} className="input mt-1" placeholder="Tell buyers about yourself..." /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label font-medium text-xs text-ink-300">Location</label><input value={editForm.location} onChange={(e) => updateEdit("location", e.target.value)} className="input mt-1" placeholder="Dhaka, Bangladesh" /></div>
                <div><label className="label font-medium text-xs text-ink-300">Phone</label><input value={editForm.phone} onChange={(e) => updateEdit("phone", e.target.value)} className="input mt-1" placeholder="01XXXXXXXXX" /></div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 font-semibold">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes</button>
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary px-5 py-2.5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Helpful Links Section */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-primary-400" />
          Helpful Links
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { to: "/faq", icon: HelpCircle, label: "FAQ", desc: "Common questions" },
            { to: "/support", icon: LifeBuoy, label: "Support", desc: "Get help fast" },
            { to: "/terms", icon: FileText, label: "Terms & Conditions", desc: "Platform rules" },
            { to: "/privacy", icon: ScrollText, label: "Privacy Policy", desc: "Your data, safe" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="card p-4 group transition-all border border-ink-800 hover:border-primary-500/40 hover:-translate-y-0.5 hover:shadow-glow bg-ink-900"
            >
              <div className="inline-grid place-items-center h-10 w-10 rounded-xl bg-ink-800 text-ink-400 transition-colors group-hover:bg-primary-500/15 group-hover:text-primary-400 border border-ink-700/50">
                <l.icon size={20} />
              </div>
              <p className="font-semibold text-white text-sm mt-3 group-hover:text-primary-300 transition-colors">{l.label}</p>
              <p className="text-xs text-ink-500 mt-0.5">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: IconType; value: string; label: string; color: string }) {
  return <div className="card p-4 border border-ink-800 shadow-md"><div className={`inline-grid place-items-center h-10 w-10 rounded-xl ${color}`}><Icon size={20} /></div><p className="font-display text-xl font-extrabold text-white mt-2.5">{value}</p><p className="text-xs text-ink-400 mt-0.5">{label}</p></div>;
}

function Row({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return <div className="flex items-center justify-between py-1 border-b border-ink-800/60 last:border-0"><span className="flex items-center gap-2 text-ink-400"><Icon size={16} className="text-primary-400" /> {label}</span><span className="font-semibold text-white">{value}</span></div>;
}

function OrderMiniRow({ order, role }: { order: Order; role: "buyer" | "seller" }) {
  return (
    <div className="card p-3.5 flex items-center gap-3.5 border border-ink-800 shadow-sm hover:border-primary-500/30 transition-colors">
      <div className="h-10 w-10 rounded-xl bg-ink-800 overflow-hidden shrink-0 border border-ink-700/40">{order.listing?.images?.[0] && <img src={order.listing.images[0]} alt="" className="h-full w-full object-cover" />}</div>
      <Link to={`/listing/${order.listing_id}`} className="flex-1 min-w-0 text-sm font-medium text-white hover:text-primary-400 line-clamp-1">{order.listing?.title ?? "Account"}</Link>
      <span className="text-sm font-semibold text-white">{formatBDT(role === "seller" ? order.seller_amount : order.price)}</span>
      <StatusBadge status={order.status} />
    </div>
  );
}

function VerifyReq({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {done ? <CheckCircle2 size={16} className="text-success-400" /> : <X size={16} className="text-ink-500" />}
      <span className={done ? "text-ink-200 font-medium" : "text-ink-500"}>{label}</span>
    </div>
  );
}
