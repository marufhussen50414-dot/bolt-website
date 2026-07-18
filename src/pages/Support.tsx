import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, MessageCircle, Mail, Phone, Send, Loader2, CheckCircle2, ShieldCheck, CreditCard, TrendingUp, AlertTriangle, User, Package } from "lucide-react";

const supportCategories = [
  { id: "payment", label: "Payment Issue", icon: CreditCard },
  { id: "delivery", label: "Delivery Problem", icon: Package },
  { id: "dispute", label: "Open a Dispute", icon: AlertTriangle },
  { id: "account", label: "Account Issue", icon: User },
  { id: "listing", label: "Listing Help", icon: TrendingUp },
  { id: "other", label: "Other", icon: LifeBuoy },
];

export default function Support() {
  const [form, setForm] = useState({ name: "", email: "", category: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false); setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary-500/15 text-primary-400 mb-4"><LifeBuoy size={28} /></div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">Support Center</h1>
        <p className="text-ink-400 mt-2 max-w-xl mx-auto">We're here to help. Reach out and we'll respond within 24 hours.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[{ icon: MessageCircle, title: "Live Chat", value: "@gamehaatbd", desc: "Fastest response — Telegram", color: "text-primary-400 bg-primary-500/15" },
          { icon: Mail, title: "Email", value: "support@gamehaatbd.com", desc: "Replies within 24 hours", color: "text-accent-400 bg-accent-500/15" },
          { icon: Phone, title: "Hotline", value: "01700-000000", desc: "Sun–Thu, 10AM–8PM", color: "text-success-400 bg-success-500/15" }].map((c) => (
          <div key={c.title} className="card p-5 hover:border-primary-500/30 transition-colors">
            <div className={`inline-grid place-items-center h-11 w-11 rounded-xl ${c.color}`}><c.icon size={22} /></div>
            <h3 className="font-semibold text-white mt-3">{c.title}</h3>
            <p className="text-sm font-medium text-ink-200 mt-0.5">{c.value}</p>
            <p className="text-xs text-ink-500 mt-1">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-1">Submit a Ticket</h2>
          <p className="text-sm text-ink-400 mb-5">Tell us what's going on and we'll get right on it.</p>
          {submitted ? (
            <div className="text-center py-10 animate-scale-in">
              <CheckCircle2 size={48} className="mx-auto text-success-400" />
              <h3 className="font-display text-lg font-bold text-white mt-4">Ticket Submitted!</h3>
              <p className="text-sm text-ink-400 mt-1 max-w-sm mx-auto">We've received your request and will email you back at <span className="text-primary-400">{form.email}</span> within 24 hours.</p>
              <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", category: "", subject: "", message: "" }); }} className="btn-secondary mt-5">Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">Your Name</label><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input" placeholder="Full name" /></div>
                <div><label className="label">Email</label><input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input" placeholder="you@example.com" /></div>
              </div>
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {supportCategories.map((c) => (
                    <button type="button" key={c.id} onClick={() => update("category", c.id)} className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition-all flex flex-col items-center gap-1.5 ${form.category === c.id ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800"}`}><c.icon size={18} /> {c.label}</button>
                  ))}
                </div>
              </div>
              <div><label className="label">Subject</label><input required value={form.subject} onChange={(e) => update("subject", e.target.value)} className="input" placeholder="Brief summary of the issue" /></div>
              <div><label className="label">Message</label><textarea required value={form.message} onChange={(e) => update("message", e.target.value)} rows={5} className="input" placeholder="Describe your issue in detail..." /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Submit Ticket</button>
            </form>
          )}
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-success-400" /> Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="text-ink-300 hover:text-primary-400">FAQ — Common Questions</Link></li>
              <li><Link to="/how-it-works" className="text-ink-300 hover:text-primary-400">How Escrow Works</Link></li>
              <li><Link to="/dashboard" className="text-ink-300 hover:text-primary-400">Your Orders & Disputes</Link></li>
            </ul>
          </div>
          <div className="card p-5 bg-gradient-to-br from-success-500/10 to-transparent border-success-500/20">
            <AlertTriangle size={22} className="text-warning-400" />
            <h3 className="font-semibold text-white mt-2">Reporting a Scam?</h3>
            <p className="text-xs text-ink-400 mt-1 leading-relaxed">If you suspect fraudulent activity, select "Open a Dispute" and include all evidence. Our team prioritizes scam reports and acts within 12 hours.</p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-2">Response Times</h3>
            <ul className="text-xs text-ink-400 space-y-1.5">
              <li className="flex justify-between"><span>Live chat</span><span className="text-success-400 font-semibold">~5 min</span></li>
              <li className="flex justify-between"><span>Email</span><span className="text-primary-400 font-semibold">~24 hrs</span></li>
              <li className="flex justify-between"><span>Disputes</span><span className="text-warning-400 font-semibold">~48 hrs</span></li>
              <li className="flex justify-between"><span>Scam reports</span><span className="text-error-400 font-semibold">~12 hrs</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
