import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, MessageCircle, Mail, ShieldCheck, CreditCard, TrendingUp, Search } from "lucide-react";

type FAQCategory = { title: string; icon: typeof HelpCircle; items: { q: string; a: string }[] };

const faqCategories: FAQCategory[] = [
  { title: "Buying", icon: CreditCard, items: [
    { q: "How do I buy a game ID?", a: "Browse listings, click on the account you want, and proceed to checkout. Pay with bKash, Nagad, or card. Your payment is held in escrow until you confirm the account transfer is complete." },
    { q: "Is my payment safe?", a: "Yes. We use a secure escrow system — your money is only released to the seller after you confirm you've received the account and changed the credentials." },
    { q: "What payment methods are supported?", a: "We support bKash, Nagad, and debit/credit cards (Visa, Mastercard). All transactions are encrypted and protected." },
    { q: "What if the seller doesn't deliver?", a: "If the seller fails to deliver the account, open a dispute from your dashboard. Our support team investigates and you receive a full refund if the claim is valid." },
    { q: "How long does delivery take?", a: "Most deliveries happen within minutes to a few hours after payment, depending on the seller's response time." },
  ]},
  { title: "Selling", icon: TrendingUp, items: [
    { q: "How much commission does GameHaatBD charge?", a: "Only 2% per completed sale — the lowest in Bangladesh. 98% of the sale price goes directly to you. No hidden fees or listing charges." },
    { q: "How do I list my game ID for sale?", a: "Click 'Sell ID', choose your game, fill in account details, set a price, and add images. Your listing is reviewed and goes live quickly." },
    { q: "When do I get paid?", a: "Payment is released to your bKash/Nagad account once the buyer confirms the account transfer, usually within 24 hours." },
    { q: "Can I edit or remove my listing?", a: "Yes. Go to Dashboard → My Listings to edit, update price, or delist your account anytime before it's sold." },
  ]},
  { title: "Safety & Escrow", icon: ShieldCheck, items: [
    { q: "What is escrow and how does it protect me?", a: "Escrow means we hold the buyer's payment safely until both parties confirm the transaction is complete. The seller can't run off with the money, and the buyer can't take the account without paying." },
    { q: "What happens during a dispute?", a: "Either party can open a dispute. Our support team reviews chat history, delivery proof, and transaction records, then makes a fair decision — usually within 48 hours." },
    { q: "How are sellers verified?", a: "Sellers build trust through completed sales and positive reviews. The verified badge is earned after a track record of successful, dispute-free transactions." },
    { q: "Is my personal information safe?", a: "Yes. We never share your phone number or contact details publicly. Sellers only see what you choose to display on your profile." },
  ]},
  { title: "Account & Profile", icon: HelpCircle, items: [
    { q: "How do I edit my profile?", a: "Go to Profile → Edit Profile to update your name, bio, location, avatar, and contact details like Discord and WhatsApp." },
    { q: "What is the trust score?", a: "Your trust score reflects your reputation — based on completed transactions, reviews, and response rate. Higher scores mean more buyers trust you." },
    { q: "I forgot my password, what do I do?", a: "On the login page, click 'Forgot password' and enter your email. You'll receive a reset link to set a new password." },
    { q: "Can I change my email address?", a: "Contact our support team via the Support page and they'll help you update your account email securely." },
  ]},
];

export default function FAQ() {
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = faqCategories.map((c) => ({ ...c, items: c.items.filter((i) => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())) })).filter((c) => c.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary-500/15 text-primary-400 mb-4"><HelpCircle size={28} /></div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">Frequently Asked Questions</h1>
        <p className="text-ink-400 mt-2 max-w-xl mx-auto">Everything you need to know about buying, selling, and staying safe on GameHaatBD</p>
      </div>
      <div className="relative mb-8 max-w-xl mx-auto"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="input pl-10" /></div>
      <div className="grid sm:grid-cols-4 gap-3 mb-8">
        {faqCategories.map((c, i) => (
          <button key={c.title} onClick={() => setOpenCat(i)} className={`card p-4 text-center transition-all ${openCat === i ? "border-primary-500/40 shadow-glow" : "hover:border-ink-700"}`}>
            <c.icon size={22} className={`mx-auto ${openCat === i ? "text-primary-400" : "text-ink-400"}`} />
            <p className={`text-sm font-semibold mt-2 ${openCat === i ? "text-white" : "text-ink-300"}`}>{c.title}</p>
            <p className="text-xs text-ink-500 mt-0.5">{c.items.length} questions</p>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <div className="card p-8 text-center text-ink-400">No questions match your search. <Link to="/support" className="text-primary-400">Contact support →</Link></div>
        : (openCat !== null ? [filtered[openCat]] : filtered).filter(Boolean).map((cat) => (
          <div key={cat.title}>
            <h2 className="font-display text-lg font-bold text-white mb-2 px-1">{cat.title}</h2>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const id = cat.title + item.q; const isOpen = openQ === id;
                return (
                  <div key={id} className="card overflow-hidden">
                    <button onClick={() => setOpenQ(isOpen ? null : id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                      <span className="font-semibold text-white text-sm">{item.q}</span>
                      <ChevronDown size={18} className={`text-ink-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && <div className="px-4 pb-4 text-sm text-ink-300 leading-relaxed animate-slide-up">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="card p-6 mt-10 text-center bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
        <h3 className="font-display text-lg font-bold text-white">Still have questions?</h3>
        <p className="text-sm text-ink-400 mt-1">Our support team is here to help you 24/7</p>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Link to="/support" className="btn-primary"><MessageCircle size={16} /> Contact Support</Link>
          <a href="mailto:support@gamehaatbd.com" className="btn-secondary"><Mail size={16} /> Email Us</a>
        </div>
      </div>
    </div>
  );
}
