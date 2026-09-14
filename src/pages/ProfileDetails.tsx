import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, Edit3, Save, X, Loader2, Mail, MapPin,
  CreditCard, ShieldCheck, Calendar, MessageCircle, CheckCircle2, User as UserIcon,
  Award, Package, ShoppingBag, TrendingUp, LifeBuoy, ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { IconType } from "../lib/utils";

function Row({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-800/60 last:border-0">
      <span className="flex items-center gap-2.5 text-ink-400 text-sm"><Icon size={15} className="text-primary-400 shrink-0" /> {label}</span>
      <span className="font-semibold text-white text-sm text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950/40 p-3.5 text-center">
      <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
        <Icon size={15} />
      </div>
      <p className="text-base font-bold text-white leading-none">{value}</p>
      <p className="mt-1 text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: IconType; children: React.ReactNode }) {
  return (
    <div className="card border border-ink-800 shadow-lg bg-ink-900 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-ink-800 bg-ink-950/30">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Icon size={15} className="text-primary-400" /> {title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

export default function ProfileDetails() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ full_name: "", bio: "", location: "", phone: "", whatsapp: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        phone: profile.phone ?? "",
        whatsapp: profile.whatsapp ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openEdit() {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "", bio: profile.bio ?? "", location: profile.location ?? "",
        phone: profile.phone ?? "", whatsapp: profile.whatsapp ?? "",
      });
    }
    setMsg("");
    setEditOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
    }).eq("id", user!.id);
    setSaving(false);
    if (error) { setMsg("Failed to save: " + error.message); return; }
    await refreshProfile();
    setEditOpen(false);
    setToast("Profile updated successfully!");
  }

  if (authLoading || !profile) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 pb-16 animate-fade-in">
      {toast && (
        <div className="fixed top-5 right-5 z-[60] animate-fade-in">
          <div className="flex items-center gap-2 rounded-xl border border-success-500/30 bg-ink-900 px-4 py-3 text-sm font-medium text-success-400 shadow-2xl">
            <CheckCircle2 size={18} /> {toast}
          </div>
        </div>
      )}

      <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <div className="space-y-5">
        {/* Header */}
        <div className="card border border-ink-800 shadow-xl bg-ink-900 overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-primary-900/70 via-ink-800 to-accent-950/70 relative">
            <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-20" />
          </div>
          <div className="px-6 pb-5 -mt-8 flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-3.5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover border-4 border-ink-900 shadow-xl bg-ink-800" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white text-xl font-extrabold border-4 border-ink-900 shadow-xl">
                  {(profile.full_name || "U").trim()[0]?.toUpperCase()}
                </div>
              )}
              <div className="pb-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-bold text-white">{profile.full_name || "Player"}</h1>
                  {profile.is_verified && (
                    <span className="badge bg-success-500/15 text-success-400 border border-success-500/20 px-2 py-0.5 text-[10px] flex items-center gap-1 font-semibold">
                      <ShieldCheck size={11} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 font-mono mt-0.5">{profile.profile_id}</p>
              </div>
            </div>
            <button onClick={openEdit} className="btn-primary px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg">
              <Edit3 size={15} /> Edit Details
            </button>
          </div>
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat icon={Award} label="Trust Score" value={Number(profile.trust_score ?? 0).toFixed(1)} />
          <MiniStat icon={Package} label="IDs Sold" value={String(profile.total_sales ?? 0)} />
          <MiniStat icon={ShoppingBag} label="IDs Bought" value={String(profile.total_purchases ?? 0)} />
          <MiniStat icon={TrendingUp} label="Response Rate" value={`${profile.response_rate ?? 0}%`} />
        </div>

        {/* Account info */}
        <SectionCard title="Account Information" icon={BadgeCheck}>
          <Row icon={BadgeCheck} label="Profile ID" value={profile.profile_id ?? "—"} />
          <Row icon={UserIcon} label="Full Name" value={profile.full_name ?? "—"} />
          <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
          <Row icon={ShieldCheck} label="Verified" value={profile.is_verified ? "Yes" : "No"} />
          <Row
            icon={Calendar}
            label="Joined"
            value={profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
        </SectionCard>

        {/* Contact info */}
        <SectionCard title="Contact Information" icon={MessageCircle}>
          <Row icon={MapPin} label="Location" value={profile.location ?? "—"} />
          <Row icon={CreditCard} label="Phone" value={profile.phone ?? "—"} />
          <Row icon={MessageCircle} label="WhatsApp" value={profile.whatsapp ?? "—"} />
        </SectionCard>

        {/* Bio */}
        {profile.bio && (
          <SectionCard title="Bio" icon={UserIcon}>
            <p className="text-sm text-ink-300 leading-relaxed py-3">{profile.bio}</p>
          </SectionCard>
        )}

        {/* Support */}
        <Link
          to="/support"
          className="card border border-ink-800 shadow-lg bg-ink-900 flex items-center justify-between gap-3 p-5 hover:border-primary-500/40 hover:bg-ink-800/40 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400 shrink-0">
              <LifeBuoy size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Need help?</p>
              <p className="text-xs text-ink-500 mt-0.5">Get support anytime from our team.</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-ink-500 shrink-0" />
        </Link>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditOpen(false)}
        >
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-ink-700 bg-ink-900 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2"><Edit3 size={18} className="text-primary-400" /> Edit Details</h2>
              <button onClick={() => setEditOpen(false)} className="text-ink-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {msg && (
                <div className="flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium shadow-md bg-error-500/10 text-error-400 border border-error-500/20">
                  <X size={16} /> {msg}
                </div>
              )}
              <div>
                <label className="label font-medium text-xs text-ink-300">Full Name</label>
                <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="input mt-1" required />
              </div>
              <div>
                <label className="label font-medium text-xs text-ink-300">Bio</label>
                <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="input mt-1" placeholder="Tell buyers about yourself..." />
              </div>
              <div>
                <label className="label font-medium text-xs text-ink-300">Location</label>
                <input value={form.location} onChange={(e) => update("location", e.target.value)} className="input mt-1" placeholder="Dhaka, Bangladesh" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label font-medium text-xs text-ink-300">Phone</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input mt-1" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="label font-medium text-xs text-ink-300">WhatsApp</label>
                  <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="input mt-1" placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 font-semibold flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                </button>
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary px-5 py-2.5">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
