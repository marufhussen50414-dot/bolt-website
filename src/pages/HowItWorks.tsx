import { Link } from "react-router-dom";
import { ShieldCheck, CreditCard, TrendingUp, Search, Tag, MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">How GameHaatBD Works</h1>
        <p className="text-ink-400 mt-2 max-w-xl mx-auto">Buy and sell game IDs safely with escrow protection and only 1% commission</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {[{ title: "For Buyers", steps: [
          { icon: Search, title: "Find an Account", desc: "Browse verified listings by game, rank, and price." },
          { icon: CreditCard, title: "Pay with Escrow", desc: "Pay with bKash, Nagad, or card. We hold your money safely." },
          { icon: MessageCircle, title: "Receive the Account", desc: "The seller transfers the account credentials to you." },
          { icon: CheckCircle2, title: "Confirm & Release", desc: "Once you've changed the password, confirm to release payment." },
        ], btn: { label: "Start Browsing", to: "/browse", primary: true } },
        { title: "For Sellers", steps: [
          { icon: Tag, title: "List Your Account", desc: "Add game, level, rank, region, and screenshots. Set your price." },
          { icon: MessageCircle, title: "Chat with Buyer", desc: "When someone buys, coordinate the account transfer via chat." },
          { icon: CheckCircle2, title: "Hand Over Account", desc: "Share credentials and help the buyer secure the account." },
          { icon: TrendingUp, title: "Get Paid (99%)", desc: "Once the buyer confirms, you receive 99% of the price — only 1% commission." },
        ], btn: { label: "Start Selling", to: "/sell", primary: false } }].map((col) => (
          <div key={col.title} className="card p-6">
            <h2 className="font-display text-xl font-bold text-white mb-4">{col.title}</h2>
            <div className="space-y-4">
              {col.steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-500/15 text-primary-400"><s.icon size={20} /></div>
                  <div><p className="font-semibold text-white text-sm">{i + 1}. {s.title}</p><p className="text-sm text-ink-400 mt-0.5">{s.desc}</p></div>
                </div>
              ))}
            </div>
            <Link to={col.btn.to} className={`${col.btn.primary ? "btn-primary" : "btn-secondary"} mt-6 w-full`}>{col.btn.label} <ArrowRight size={16} /></Link>
          </div>
        ))}
      </div>
      <div className="card p-8 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
        <h2 className="font-display text-2xl font-bold text-white text-center">Why GameHaatBD is Safe</h2>
        <div className="grid sm:grid-cols-3 gap-5 mt-6">
          {[{ icon: ShieldCheck, title: "Escrow Protected", desc: "Money held safely until both parties confirm." }, { icon: CheckCircle2, title: "Verified Sellers", desc: "Trust scores and reviews from real transactions." }, { icon: TrendingUp, title: "Lowest Fees", desc: "Only 1% commission. No hidden charges." }].map((f) => (
            <div key={f.title} className="text-center">
              <div className="inline-grid place-items-center h-12 w-12 rounded-xl bg-white/10 text-white mx-auto"><f.icon size={24} /></div>
              <h3 className="font-semibold text-white mt-3">{f.title}</h3><p className="text-sm text-ink-300 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
