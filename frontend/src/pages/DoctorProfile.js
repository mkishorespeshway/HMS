import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Logo from "../components/Logo";

export default function DoctorProfile() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [online, setOnline] = useState(() => {
    const v = localStorage.getItem("doctorOnline");
    return v === null ? true : v === "1";
  });
  
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    specializations: "",
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    consultationFees: "",
    slotDurationMins: ""
  });

  useEffect(() => {
    const load = async () => {
      const id = localStorage.getItem("userId");
      if (!id) return;
      
      try {
        const { data } = await API.get("/doctors", { params: { user: id } });
        setProfile(data?.[0] || null);
        const byId = localStorage.getItem(`doctorOnlineById_${id}`);
        if (byId !== null) setOnline(byId === "1");
      } catch (e) {}
      
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("doctorOnline", online ? "1" : "0");
    const id = localStorage.getItem("userId");
    if (id) localStorage.setItem(`doctorOnlineById_${id}`, online ? "1" : "0");
  }, [online]);

  const name = profile?.user?.name || "";
  const specs = (profile?.specializations || []).join(", ");
  const about = profile?.about || "";
  const fee = profile?.consultationFees ?? "";
  const address = profile?.clinic?.address || "";
  const city = profile?.clinic?.city || "";

  const startEdit = () => {
    setError("");
    setForm({
      specializations: (profile?.specializations || []).join(", "),
      clinicName: profile?.clinic?.name || "",
      clinicAddress: profile?.clinic?.address || "",
      clinicCity: profile?.clinic?.city || "",
      consultationFees: String(profile?.consultationFees ?? ""),
      slotDurationMins: String(profile?.slotDurationMins ?? "")
    });
    setEditing(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        specializations: String(form.specializations || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        clinic: {
          name: form.clinicName || "",
          address: form.clinicAddress || "",
          city: form.clinicCity || ""
        },
        consultationFees: form.consultationFees ? Number(form.consultationFees) : undefined,
        slotDurationMins: form.slotDurationMins ? Number(form.slotDurationMins) : undefined
      };
      const { data } = await API.post("/doctors/me", payload);
      setProfile(data);
      setEditing(false);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                <Logo size={24} />
                <span>HospoZen</span>
              </div>
            </div>
            <nav className="space-y-2 text-slate-700">
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Profile</div>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Doctor Profile</h1>
            <button
              onClick={() => { localStorage.removeItem("token"); nav("/doctor/login"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                {String(profile?.photoBase64 || "").startsWith("data:image") ? (
                  <img
                    src={profile?.photoBase64}
                    alt="Doctor"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg border bg-white" />
                )}
              </div>
              <div className="sm:col-span-2">
                <div className="text-xl font-semibold">{name}</div>
                <div className="text-sm text-slate-600">{specs}</div>
                <p className="mt-3 text-sm text-slate-700">{about}</p>
                {fee !== "" && (<div className="mt-4 text-sm text-slate-700">Appointment Fee: ₹{fee}</div>)}
                <div className="mt-1 text-sm text-slate-700">Address: {address}</div>
                <div className="mt-1 text-sm text-slate-700">City: {city}</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`inline-block text-xs px-2 py-1 rounded ${online ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"}`}>{online ? "Online" : "Offline"}</span>
                  <button
                    onClick={() => setOnline((v) => !v)}
                    className={`text-xs px-3 py-1 rounded-full border ${online ? "border-green-600 text-green-700" : "border-slate-600 text-slate-700"}`}
                  >
                    {online ? "Go Offline" : "Go Online"}
                  </button>
                </div>
                <button onClick={startEdit} className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">Edit</button>
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
              {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
              <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specializations</label>
                  <input name="specializations" value={form.specializations} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" placeholder="e.g., Cardiology, Dermatology" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Name</label>
                  <input name="clinicName" value={form.clinicName} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input name="clinicCity" value={form.clinicCity} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input name="clinicAddress" value={form.clinicAddress} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fees</label>
                  <input name="consultationFees" value={form.consultationFees} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (mins)</label>
                  <input name="slotDurationMins" value={form.slotDurationMins} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full" />
                </div>
                <div className="sm:col-span-2 flex gap-3 mt-2">
                  <button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">{saving ? "Saving..." : "Save"}</button>
                  <button type="button" onClick={() => setEditing(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-md">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
