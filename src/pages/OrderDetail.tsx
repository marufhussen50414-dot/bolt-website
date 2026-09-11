import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, User, Mail, Phone, CreditCard,
  Tag, Gavel, Calendar, CheckCircle2, AlertTriangle, Map,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatBDT, timeAgo, statusClass, statusLabel } from "../lib/utils";
import OrderRoadmap from "../components/OrderRoadmap";

type OrderDetailRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_images: string[] | null;
  status: string;
  payment_method: string;
  payment_number: string | null;
  role: "buyer" | "seller";
  my_amount: number;
  counterparty_id: string;
  counterparty_name: string | null;
  counterparty_username: string | null;
  counterparty_avatar: string | null;
  counterparty_phone: string | null;
  counterparty_email: string | null;
  offer_price: number | null;
  created_at: string;
  completed_at: string | null;
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.rpc("get_order_detail", { order_id: id });
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (data && data.length > 0) {
        setOrder(data[0] as OrderDetailRow);
      } else {
        setError("Order not found.");
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Loader2 size={28} className="animate-spin text-primary-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <AlertTriangle size={40} className="mx-auto text-error-400" />
        <p className="text-white font-semibold mt-4">{error ?? "Order not found."}</p>
        <Link to="/profile" className="btn-secondary mt-5 inline-flex">Back to Profile</Link>
      </div>
    );
  }

  const isBuyer = order.role === "buyer";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      {/* Header card */}
      <div className="card p-5 border border-ink-800 shadow-lg mb-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-ink-800 overflow-hidden shrink-0 border border-ink-700/40">
            {order.listing_images?.[0] && <img src={order.listing_images[0]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg font-bold text-white">{order.listing_title}</h1>
              <span className={`badge border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(order.status)}`}>
                {statusLabel(order.status)}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1 flex items-center gap-1.5">
              <Calendar size={13} /> Ordered {timeAgo(order.created_at)}
              {order.completed_at && <> · <CheckCircle2 size={13} className="text-success-400" /> Completed {timeAgo(order.completed_at)}</>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
        {/* Order timeline — left on desktop */}
        <div className="card p-5 border border-ink-800 shadow-lg lg:order-1">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Map size={18} className="text-primary-400" /> Order Timeline</h3>
          <OrderRoadmap status={order.status} role={order.role} />
        </div>

        {/* Payment + counterparty — right on desktop */}
        <div className="space-y-5 lg:order-2">
          <div className="card p-5 border border-ink-800 shadow-lg">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Tag size={18} className="text-primary-400" /> Payment</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-ink-800/60">
                <span className="text-ink-400">Listing Price</span>
                <span className="font-semibold text-white">{formatBDT(order.listing_price)}</span>
              </div>
              {order.offer_price != null && (
                <div className="flex items-center justify-between py-1 border-b border-ink-800/60">
                  <span className="text-ink-400 flex items-center gap-1.5"><Gavel size={14} className="text-accent-400" /> Purchased via Offer</span>
                  <span className="font-semibold text-accent-300">{formatBDT(order.offer_price)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1 border-b border-ink-800/60">
                <span className="text-ink-400">{isBuyer ? "You Paid" : "You'll Receive"}</span>
                <span className="font-bold text-primary-300 text-base">{formatBDT(order.my_amount)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-400 flex items-center gap-1.5"><CreditCard size={14} /> Payment Method</span>
                <span className="font-semibold text-white capitalize">{order.payment_method}{order.payment_number ? ` · ${order.payment_number}` : ""}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 border border-ink-800 shadow-lg">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-primary-400" /> {isBuyer ? "Seller" : "Buyer"} Information
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white font-bold overflow-hidden shrink-0">
                {order.counterparty_avatar ? (
                  <img src={order.counterparty_avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (order.counterparty_name ?? "U").trim()[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{order.counterparty_name ?? "Unknown"}</p>
                {order.counterparty_username && <p className="text-xs text-ink-500">@{order.counterparty_username}</p>}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {order.counterparty_email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-ink-500 shrink-0" />
                  <span className="text-ink-200">{order.counterparty_email}</span>
                </div>
              )}
              {order.counterparty_phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-ink-500 shrink-0" />
                  <span className="text-ink-200">{order.counterparty_phone}</span>
                </div>
              )}
              {!order.counterparty_email && !order.counterparty_phone && (
                <p className="text-ink-500 text-xs">No contact info on file.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
