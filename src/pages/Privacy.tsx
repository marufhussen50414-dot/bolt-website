import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Eye, Database, Mail, Share2 } from "lucide-react";

type Section = { icon: typeof Lock; title: string; body: string };

const sections: Section[] = [
  { icon: Database, title: "1. Information We Collect", body: "When you create an account, we collect your email address, username, full name, phone number, and location. For transactions, we store payment method details (bKash/Nagad numbers) and chat messages between buyers and sellers. Profile photos you upload are stored in our secure storage." },
  { icon: Eye, title: "2. How We Use Your Data", body: "Your information powers your profile, enables secure transactions, facilitates buyer-seller communication, and helps us prevent fraud. We use your phone number only for transaction-related notifications. Your trust score and reputation metrics are derived from your activity on the platform." },
  { icon: Lock, title: "3. Data Protection", body: "All passwords are hashed using industry-standard encryption. Payment information is processed through encrypted channels and never stored in plain text. Row-level security ensures you can only access your own data and conversations. We never sell your personal information to third parties." },
  { icon: Share2, title: "4. What Sellers & Buyers Can See", body: "Your phone number and email are never shown publicly. Sellers see only your username and profile details you choose to display. During a transaction, payment numbers are shared only between the two parties involved in that specific deal." },
  { icon: ShieldCheck, title: "5. Your Rights", body: "You can edit or update your profile information at any time from your Profile page. You may request deletion of your account and associated data by contacting support. Chat histories are retained for dispute resolution purposes for up to 90 days after a transaction completes." },
  { icon: Mail, title: "6. Contact Us", body: "If you have questions about how your data is handled, or wish to exercise your data rights, reach out to our support team. We respond to privacy-related inquiries within 48 hours and take your data security seriously." },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-success-500/15 text-success-400 mb-4"><ShieldCheck size={28} /></div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-ink-400 mt-2 max-w-xl mx-auto">How GameHaatBD collects, uses, and protects your personal information</p>
        <p className="text-xs text-ink-500 mt-3">Last updated: July 2026</p>
      </div>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="card p-5">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2.5 mb-2">
              <span className="inline-grid place-items-center h-9 w-9 rounded-xl bg-success-500/10 text-success-400"><s.icon size={18} /></span>
              {s.title}
            </h2>
            <p className="text-sm text-ink-300 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="card p-6 mt-8 text-center bg-gradient-to-r from-success-500/10 to-primary-500/10 border-success-500/20">
        <h3 className="font-display text-lg font-bold text-white">Have privacy concerns?</h3>
        <p className="text-sm text-ink-400 mt-1">We're committed to protecting your data</p>
        <Link to="/support" className="btn-primary mt-4 inline-flex">Contact Support</Link>
      </div>
    </div>
  );
}
