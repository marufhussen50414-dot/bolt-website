import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Tag, ShoppingBag, Wallet, LayoutDashboard, PlusCircle, Package, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Order, Profile } from "../lib/types";
import { formatBDT, timeAgo, classNames, IconType, statusClass, statusLabel } from "../lib/utils";

type Tab = "overview" | "buying" | "selling" | "listings";

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const initialTab = (params.get("tab") as Tab) ?? "overview";
  const [tab, setTab] = useState<Tab>(["overview", "buying", "selling", "listings"].includes(initialTab) ? initialTab : "overview");
  const [myListings, setMyListings] = useState<GameListing[]>([]);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [listRes, buyRes, sellRes] = await Promise.all([
        supabase.from("game_listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, listing:game_listings(*), seller:profiles(full_name, username, is_verified)").eq("buyer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*, listing:game_listings(*), buyer:profiles(full_name, username)").eq("seller_id", user.id).order("created_at", { ascending: false }),
      ]);
      setMyListings((listRes.data as GameListing[]) ?? []);
      setBuyOrders((buyRes.data as Order[]) ?? []);
      setSellOrders((sellRes.data as Order[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!user) return <div className="mx-auto max-w-md py-16 text-center"><div className="card p-8"><h2 className="font-display text-xl font-bold text-white">Log in to view your dashboard</h2><Link to="/login" className="btn-primary mt-5 inline-flex">Log In</Link></div></div>;

  const displayName = profile?.full_name ?? profile?.username ?? "User";
  const completedSales = sellOrders.filter((o) => o.status === "completed");
  const totalEarnings = completedSales.reduce((s, o) => s + o.seller_amount, 0);
  const totalSpent = buyOrders.filter((o) => o.status === "completed" || o.status === "paid").reduce((s, o) => s + o.price, 0);

  const tabs: { id: Tab; label: string; icon: IconType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard }, { id: "buying", label: "Buying", icon: ShoppingBag },
    { id: "selling", label: "Selling", icon: TrendingUp }, { id: "listings", label: "My Listings", icon: Tag },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xl font-bold">{(profile?.full_name ?? profile?.username)?.[0]?.toUpperCase() ?? "U"}</div>
        <div><h1 className="font-display text-2xl font-extrabold text-white">{displayName}</h1><p className="text-sm text-ink-400">{user.email}</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon={Wallet} value={formatBDT(totalEarnings)} label="Earnings" color="text-success-400 bg-success-500/15" />
        <Stat icon={ShoppingBag} value={formatBDT(totalSpent)} label="Spent" color="text-primary-400 bg-primary-500/15" />
        <Stat icon={Tag} value={String(myListings.length)} label="Listings" color="text-accent-400 bg-accent-500/15" />
        <Stat icon={Package} value={String(completedSales.length)} label="Sold" color="text-warning-400 bg-warning-500/15" />
      </div>
      <div className="flex gap-1 border-b border-ink-800 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={classNames("flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap", tab === t.id ? "border-primary-500 text-primary-400" : "border-transparent text-ink-400 hover:text-white")}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="animate-spin text-primary-500" size={28} /></div> : (
        <>
          {tab === "overview" && (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/sell" className="rounded-xl bg-ink-800 hover:bg-ink-700 p-4 text-center transition-colors group"><PlusCircle size={22} className="mx-auto text-accent-400 group-hover:scale-110 transition-transform" /><p className="text-sm font-semibold text-white mt-2">New Listing</p></Link>
                  <Link to="/browse" className="rounded-xl bg-ink-800 hover:bg-ink-700 p-4 text-center transition-colors group"><ShoppingBag size={22} className="mx-auto text-primary-400 group-hover:scale-110 transition-transform" /><p className="text-sm font-semibold text-white mt-2">Browse IDs</p></Link>
                  <Link to="/profile" className="rounded-xl bg-ink-800 hover:bg-ink-700 p-4 text-center transition-colors group"><LayoutDashboard size={22} className="mx-auto text-success-400 group-hover:scale-110 transition-transform" /><p className="text-sm font-semibold text-white mt-2">My Profile</p></Link>
                  <Link to="/support" className="rounded-xl bg-ink-800 hover:bg-ink-700 p-4 text-center transition-colors group"><Wallet size={22} className="mx-auto text-warning-400 group-hover:scale-110 transition-transform" /><p className="text-sm font-semibold text-white mt-2">Support</p></Link>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {sellOrders.slice(0, 3).map((o) => <OrderRow key={o.id} order={o} role="seller" />)}
                  {buyOrders.slice(0, 3).map((o) => <OrderRow key={o.id} order={o} role="buyer" />)}
                  {sellOrders.length === 0 && buyOrders.length === 0 && <p className="text-sm text-ink-500">No activity yet.</p>}
                </div>
              </div>
            </div>
          )}
          {tab === "buying" && <div className="space-y-3">{buyOrders.length > 0 ? buyOrders.map((o) => <OrderRow key={o.id} order={o} role="buyer" />) : <Empty text="No purchases yet." cta={<Link to="/browse" className="btn-primary mt-3 inline-flex">Browse IDs</Link>} />}</div>}
          {tab === "selling" && <div className="space-y-3">{sellOrders.length > 0 ? sellOrders.map((o) => <OrderRow key={o.id} order={o} role="seller" />) : <Empty text="No sales yet." cta={<Link to="/sell" className="btn-primary mt-3 inline-flex">Sell an ID</Link>} />}</div>}
          {tab === "listings" && <div className="space-y-3"><div className="flex justify-end"><Link to="/sell" className="btn-primary"><PlusCircle size={16} /> New Listing</Link></div>{myListings.length > 0 ? myListings.map((l) => <ListingRow key={l.id} listing={l} />) : <Empty text="No listings yet." />}</div>}
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label, color }: { icon: IconType; value: string; label: string; color: string }) {
  return <div className="card p-4"><div className={`inline-grid place-items-center h-10 w-10 rounded-xl ${color}`}><Icon size={20} /></div><p className="font-display text-xl font-extrabold text-white mt-2">{value}</p><p className="text-xs text-ink-400">{label}</p></div>;
}
function OrderRow({ order, role }: { order: Order; role: "buyer" | "seller" }) {
  const other = (role === "buyer" ? order.seller : order.buyer) as Profile | undefined;
  return (
    <Link to={`/listing/${order.listing_id}`} className="card p-3 flex items-center gap-3 hover:border-primary-500/30 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-ink-800 overflow-hidden shrink-0">{order.listing?.images?.[0] && <img src={order.listing.images[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white line-clamp-1">{order.listing?.title ?? "Account"}</p><p className="text-xs text-ink-500">{role === "buyer" ? "From" : "To"} {other?.full_name ?? other?.username ?? "User"} • {timeAgo(order.created_at)}</p></div>
      <span className="text-sm font-semibold text-white">{formatBDT(role === "seller" ? order.seller_amount : order.price)}</span>
      <span className={classNames("badge border", statusClass(order.status))}>{statusLabel(order.status)}</span>
    </Link>
  );
}
function ListingRow({ listing }: { listing: GameListing }) {
  return (
    <Link to={`/listing/${listing.id}`} className="card p-3 flex items-center gap-3 hover:border-primary-500/30 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-ink-800 overflow-hidden shrink-0">{listing.images?.[0] && <img src={listing.images[0]} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white line-clamp-1">{listing.title}</p><p className="text-xs text-ink-500">{listing.view_count} views • {timeAgo(listing.created_at)}</p></div>
      <span className="text-sm font-semibold text-white">{formatBDT(listing.price)}</span>
      <span className={classNames("badge border", statusClass(listing.status))}>{statusLabel(listing.status)}</span>
    </Link>
  );
}
function Empty({ text, cta }: { text: string; cta?: React.ReactNode }) {
  return <div className="card p-10 text-center"><p className="text-ink-400">{text}</p>{cta}</div>;
}
