import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, Edit3, Save, X, Loader2, Mail, MapPin,
  CreditCard, ShieldCheck, Calendar, MessageCircle, CheckCircle2, User as UserIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { classNames, IconType } from "../lib/utils";

function Row({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-800/60 last:border-0">
      <span className="flex items-center gap-2.5 text-ink-400 text-sm"><Icon size={16} className="text-primary-400" /> {label}</span>
      <span className="font-semibold text-white text-sm text-right">{value}</span>
    </div>
  );
}

export default function ProfileDetails() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
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
    setMsg("");
    setEditing(false);
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

      <div className="card p-6 sm:p-8 border border-ink-800 shadow-2xl bg-ink-900">
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-2xl object-cover border-2 border-ink-700 shadow-lg" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 grid place-items-center text-white text-xl font-extrabold border-2 border-ink-700 shadow-lg">
              {(profile.full_name || "U").trim()[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-white">{profile.full_name || "Player"}</h1>
            <p className="text-sm text-ink-500 font-mono">{profile.profile_id}</p>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-1">
            <Row icon={BadgeCheck} label="Profile ID" value={profile.profile_id ?? "—"} />
            <Row icon={UserIcon} label="Full Name" value={profile.full_name ?? "—"} />
            <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
            <Row icon={MapPin} label="Location" value={profile.location ?? "—"} />
            <Row icon={CreditCard} label="Phone" value={profile.phone ?? "—"} />
            <Row icon={MessageCircle} label="WhatsApp" value={profile.whatsapp ?? "—"} />
            <Row icon={ShieldCheck} label="Verified" value={profile.is_verified ? "Yes" : "No"} />
            <Row
              icon={Calendar}
              label="Joined"
              value={profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
            />

            {profile.bio && (
              <div className="pt-4">
                <p className="text-xs font-semibold text-ink-400 mb-1.5">Bio</p>
                <p className="text-sm text-ink-300 leading-relaxed bg-ink-950/40 p-3.5 rounded-xl border border-ink-800/60">{profile.bio}</p>
              </div>
            )}

            <button onClick={() => setEditing(true)} className="btn-primary w-full py-2.5 mt-6 font-semibold flex items-center justify-center gap-2">
              <Edit3 size={16} /> Edit Details
            </button>
          </div>
        ) : (
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
            <div className={classNames("flex gap-3 pt-3")}>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 font-semibold flex items-center justify-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setMsg("");
                  if (profile) {
                    setForm({
                      full_name: profile.full_name ?? "", bio: profile.bio ?? "", location: profile.location ?? "",
                      phone: profile.phone ?? "", whatsapp: profile.whatsapp ?? "",
                    });
                  }
                }}
                className="btn-secondary px-5 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
