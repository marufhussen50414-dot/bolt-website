import { useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Offer, Profile } from "../lib/types";
import { formatBDT } from "../lib/utils";

export default function Checkout() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const offerId = params.get("offer");

  const [listing, setListing] = useState<GameListing | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"bkash" | "nagad" | "card">("bkash");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [showDisabledNotice, setShowDisabledNotice] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: li } = await supabase
        .from("game_listings")
        .select("*, seller:profiles(full_name, username, is_verified)")
        .eq("id", id)
        .maybeSingle();
      setListing(li as GameListing);

      if (offerId) {
        const { data: of } = await supabase
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .maybeSingle();
        setOffer((of as Offer | null) ?? null);
      }
      setLoading(false);
    })();
  }, [id, offerId]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!listing) return <div className="mx-auto max-w-md py-16 text-center"><p className="text-ink-400">Listing not found.</p><Link to="/browse" className="btn-primary mt-4 inline-flex">Browse</Link></div>;
  if (!user) return <div className="mx-auto max-w-md py-16 text-center"><p className="text-ink-400">Please log in to buy.</p><Link to="/login" className="btn-primary mt-4 inline-flex">Log In</Link></div>;

  // If an offer was supplied it must be accepted and belong to this user.
  const useOffer = !!offer && offer.status === "pending" && offer.buyer_id === user.id && offer.listing_id === listing.id;
  if (offerId && !useOffer) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-error-400" />
        <p className="text-ink-200 mt-3 font-semibold">This offer is no longer payable.</p>
        <p className="text-sm text-ink-400 mt-1">It may have expired, been declined, or already paid.</p>
        <Link to="/messages" className="btn-primary mt-4 inline-flex">Back to Messages</Link>
      </div>
    );
  }

  const seller = listing.seller as Profile | undefined;
  const unitPrice = useOffer ? (offer!.offer_price) : listing.price;
  const commission = unitPrice * 0.02;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowDisabledNotice(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/listing/${listing.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-4"><ArrowLeft size={16} /> Back to listing</Link>
      <h1 className="font-display text-2xl font-extrabold text-white mb-6">Checkout</h1>
      {useOffer && (
        <div className="card p-3 mb-4 flex items-center gap-2 text-sm text-primary-300 border border-primary-500/30">
          <ShieldCheck size={16} className="shrink-0 text-primary-400" />
          You are paying the agreed offer price of {formatBDT(offer!.offer_price)} for this listing.
        </div>
      )}
      <div className="card p-5 mb-4">
        <div className="flex gap-3">
          <img src={listing.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=200"} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <div className="flex-1"><p className="font-semibold text-white">{listing.title}</p><p className="text-sm text-ink-400">Sold by {seller?.full_name ?? seller?.username}</p></div>
          <div className="text-right">
            {useOffer && <p className="text-xs text-ink-500 line-through">{formatBDT(listing.price)}</p>}
            <p className="font-display text-xl font-extrabold text-white">{formatBDT(unitPrice)}</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {(["bkash", "nagad", "card"] as const).map((m) => (
              <button type="button" key={m} onClick={() => setMethod(m)} className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold capitalize transition-all ${method === m ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800"}`}>{m}</button>
            ))}
          </div>
        </div>
        <div><label className="label">{method === "card" ? "Card Number" : `${method} Number`}</label><input required value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} className="input" placeholder={method === "card" ? "XXXX XXXX XXXX XXXX" : "01XXXXXXXXX"} /></div>
        <div className="rounded-xl bg-ink-800 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-400"><span>Price</span><span className="text-white">{formatBDT(unitPrice)}</span></div>
          <div className="flex justify-between text-ink-400"><span>Commission (2%)</span><span className="text-white">{formatBDT(commission)}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-ink-700 pt-2"><span className="text-white">You Pay</span><span className="text-primary-400">{formatBDT(unitPrice)}</span></div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-success-500/10 border border-success-500/20 p-3 text-xs text-success-400"><ShieldCheck size={16} className="shrink-0 mt-0.5" /><span>Your payment is held in escrow and only released to the seller once you confirm the account transfer.</span></div>
        {showDisabledNotice && (
          <div className="rounded-xl bg-warning-500/10 border border-warning-500/20 p-4 text-sm animate-fade-in">
            <p className="font-semibold text-warning-400">Buying is temporarily unavailable — the site hasn't officially launched yet. You'll be able to buy IDs once GameHaatBD goes live. You're welcome to list your ID for sale in the meantime.</p>
            <p className="text-ink-400 mt-2">এই মুহূর্তে কেনাকাটা সাময়িকভাবে বন্ধ আছে — ওয়েবসাইট এখনো অফিসিয়ালি চালু হয়নি। ওয়েবসাইট লঞ্চ হওয়ার পর আপনি আইডি কিনতে পারবেন। তবে চাইলে এখনই আপনার আইডি সেল পোস্ট করে রাখতে পারেন।</p>
          </div>
        )}
        <button type="submit" className="btn-primary w-full">{`Pay ${formatBDT(unitPrice)}`}</button>
      </form>
    </div>
  );
}
