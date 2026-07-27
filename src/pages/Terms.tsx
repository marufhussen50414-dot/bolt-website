import { Link } from "react-router-dom";
import { FileText, ShieldCheck, AlertTriangle, CreditCard, Users, Scale } from "lucide-react";

type Section = { icon: typeof FileText; title: string; body: string };

const sections: Section[] = [
  { icon: Users, title: "1. Acceptance of Terms", body: "By creating an account, browsing listings, or completing a transaction on GameHaatBD, you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of the platform immediately. These terms apply to all users whether you are a buyer, seller, or visitor." },
  { icon: CreditCard, title: "2. Buying & Selling", body: "Sellers are responsible for providing accurate account details and transferring ownership safely after payment is confirmed. Buyers must verify received accounts and change all credentials immediately. GameHaatBD acts as an intermediary and escrow holder — we do not own the accounts listed. A 2% commission is deducted from each completed sale." },
  { icon: ShieldCheck, title: "3. Escrow & Payments", body: "All payments are held in escrow until the buyer confirms successful account transfer. Funds are released to the seller's bKash or Nagad account within 24 hours of confirmation. If a dispute arises, funds remain held until our support team resolves the case, typically within 48 hours." },
  { icon: AlertTriangle, title: "4. Prohibited Conduct", body: "You may not list stolen, hacked, or fraudulently obtained accounts. Fake listings, price manipulation, off-platform payment requests, and harassment of other users are strictly prohibited. Violations result in immediate account suspension and forfeiture of any pending payouts." },
  { icon: Scale, title: "5. Disputes & Refunds", body: "Either party may open a dispute from their dashboard. Our team reviews chat logs, delivery evidence, and transaction records to make a fair decision. Valid claims receive a full refund. Decimals and fraudulent disputes may impact your trust score." },
  { icon: FileText, title: "6. Changes to Terms", body: "GameHaatBD reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. Material changes will be communicated via email or in-app notification." },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary-500/15 text-primary-400 mb-4"><FileText size={28} /></div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">Terms & Conditions</h1>
        <p className="text-ink-400 mt-2 max-w-xl mx-auto">The rules that keep GameHaatBD fair and safe for every buyer and seller</p>
        <p className="text-xs text-ink-500 mt-3">Last updated: July 2026</p>
      </div>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="card p-5">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2.5 mb-2">
              <span className="inline-grid place-items-center h-9 w-9 rounded-xl bg-primary-500/10 text-primary-400"><s.icon size={18} /></span>
              {s.title}
            </h2>
            <p className="text-sm text-ink-300 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="card p-6 mt-8 text-center bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
        <h3 className="font-display text-lg font-bold text-white">Questions about these terms?</h3>
        <p className="text-sm text-ink-400 mt-1">Our support team is happy to clarify anything</p>
        <Link to="/support" className="btn-primary mt-4 inline-flex">Contact Support</Link>
      </div>
    </div>
  );
}
