import { useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Copy, Check, Loader2, ShieldCheck, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatBDT } from "../lib/utils";

export default function PaymentInstructions() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const amount = Number(params.get("amount") ?? 0);
  const method = (params.get("method") ?? "bkash") as "bkash" | "nagad" | "card";

  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tnx, setTnx] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_settings").select("bkash_number, nagad_number").eq("id", 1).maybeSingle();
      setNumber(method === "nagad" ? (data?.nagad_number ?? "") : (data?.bkash_number ?? ""));
      setLoading(false);
    })();
  }, [method]);

  function copyNumber() {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !orderId || !tnx.trim()) return;
    setSubmitting(true);
    setError("");
    const { error: insErr } = await supabase.from("payment_confirmations").insert({
      order_id: orderId,
      buyer_id: user.id,
      method,
      amount,
      submitted_tnx_id: tnx.trim(),
    });
    setSubmitting(false);
    if (insErr) { setError(insErr.message); return; }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 mb-4">
            <Clock size={26} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Payment submitted</h1>
          <p className="text-sm text-slate-500 mb-6">
            We've received your transaction ID. Our team will verify it and confirm your order shortly — you'll be able to track progress from your order page.
          </p>
          <button onClick={() => navigate(`/order/${orderId}`)} className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 transition-colors">
            View Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <Link to={`/order/${orderId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4">
          <ArrowLeft size={15} /> Back to order
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-100">Complete your payment</p>
            <p className="text-2xl font-extrabold mt-0.5">{formatBDT(amount)}</p>
            <p className="text-xs text-primary-100 mt-1 capitalize">via {method}</p>
          </div>

          <div className="p-6 space-y-5">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary-500" size={22} /></div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Send money to this number</p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="font-mono text-lg font-bold text-slate-800">{number || "—"}</span>
                    <button type="button" onClick={copyNumber} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 shrink-0">
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <ol className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex gap-2.5"><span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">1</span> Open your {method === "nagad" ? "Nagad" : "bKash"} app and choose <b>Send Money</b>.</li>
                  <li className="flex gap-2.5"><span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">2</span> Send exactly <b>{formatBDT(amount)}</b> to the number above.</li>
                  <li className="flex gap-2.5"><span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">3</span> Copy the Transaction ID from the confirmation SMS/app.</li>
                  <li className="flex gap-2.5"><span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">4</span> Paste it below and submit.</li>
                </ol>

                <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Transaction ID</label>
                    <input
                      value={tnx}
                      onChange={(e) => setTnx(e.target.value)}
                      placeholder="e.g. 9J7K2X4L1M"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 flex items-center justify-center gap-2 transition-colors">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Verify Payment
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Your payment is held safely and verified by our team before the order proceeds.
        </p>
      </div>
    </div>
  );
}
