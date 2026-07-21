import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || "Player",
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        whatsapp: whatsapp.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    refreshProfile();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-extrabold text-white">Profile</h1>
      <p className="mt-1 text-ink-400">Update your public seller information</p>

      <div className="card mt-8 p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-error-500/40 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg border border-success-500/40 bg-success-500/10 px-4 py-3 text-sm text-success-300">Saved successfully</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="01xxxxxxxxx" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" placeholder="01xxxxxxxxx" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input resize-none" placeholder="Tell buyers about yourself..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}
