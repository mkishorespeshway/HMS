import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Logo from "../components/Logo";

export default function DoctorProfile() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [online, setOnline] = useState(() => {
    const uid = localStorage.getItem("userId") || "";
    const byId = uid ? localStorage.getItem(`doctorOnlineById_${uid}`) : null;
    if (byId !== null) return byId === "1";
    const v = localStorage.getItem("doctorOnline");
    return v === null ? true : v === "1";
  });
  const [busy, setBusy] = useState(() => {
    const uid = localStorage.getItem("userId") || "";
    const byId = uid ? localStorage.getItem(`doctorBusyById_${uid}`) : null;
    return byId === "1";
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelItems, setPanelItems] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelUnread, setPanelUnread] = useState(0);
  const [bellCount, setBellCount] = useState(0);
  
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
        const p = data?.[0] || null;
        setProfile(p);
        const onlineById = localStorage.getItem(`doctorOnlineById_${id}`);
        const busyById = localStorage.getItem(`doctorBusyById_${id}`);
        if (onlineById !== null) setOnline(onlineById === "1");
        else if (typeof p?.isOnline === 'boolean') setOnline(!!p.isOnline);
        if (busyById !== null) setBusy(busyById === "1");
        else if (typeof p?.isBusy === 'boolean') setBusy(!!p.isBusy);
      } catch (e) {}
      
    };
    load();
  }, []);

  useEffect(() => {
    try {
      const chan = new BroadcastChannel('doctorStatus');
      const my = localStorage.getItem('userId') || '';
      chan.onmessage = (e) => {
        const { uid, online: on, busy: bz } = e.data || {};
        if (!uid || uid === my) {
          if (typeof on === 'boolean') {
            setOnline(on);
            localStorage.setItem(`doctorOnlineById_${my}`, on ? '1' : '0');
          }
          if (typeof bz === 'boolean') {
            setBusy(bz);
            localStorage.setItem(`doctorBusyById_${my}`, bz ? '1' : '0');
          }
        }
      };
      return () => { try { chan.close(); } catch(_) {} };
    } catch(_) {}
  }, []);

  useEffect(() => {
    localStorage.setItem("doctorOnline", online ? "1" : "0");
    const id = localStorage.getItem("userId");
    if (id) localStorage.setItem(`doctorOnlineById_${id}`, online ? "1" : "0");
  }, [online]);
  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) localStorage.setItem(`doctorBusyById_${id}`, busy ? "1" : "0");
  }, [busy]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/notifications', { params: { unread: 1 } });
        const items = Array.isArray(data) ? data : [];
        const unread = items.filter((x) => !x.read).length;
        setBellCount(unread);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    const refreshStatus = async () => {
      try {
        const id = localStorage.getItem('userId') || '';
        if (!id) return;
        const onLS = localStorage.getItem(`doctorOnlineById_${id}`);
        const bzLS = localStorage.getItem(`doctorBusyById_${id}`);
        if (onLS !== null) setOnline(onLS === '1');
        if (bzLS !== null) setBusy(bzLS === '1');
        const { data } = await API.get('/doctors', { params: { user: id } });
        const p = Array.isArray(data) ? data[0] : null;
        if (p && typeof p.isOnline === 'boolean') setOnline(!!p.isOnline);
        if (p && typeof p.isBusy === 'boolean') setBusy(!!p.isBusy);
      } catch(_) {}
    };
    const onFocus = () => { refreshStatus(); };
    const onVis = () => { if (document.visibilityState === 'visible') refreshStatus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(refreshStatus, 8000);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVis); clearInterval(t); };
  }, []);

  const setStatus = async (status) => {
    const uid = localStorage.getItem("userId") || "";
    if (status === "online") {
      localStorage.setItem(`doctorOnlineById_${uid}`, "1");
      localStorage.setItem(`doctorBusyById_${uid}`, "0");
      setOnline(true);
      setBusy(false);
      try { await API.put('/doctors/me/status', { isOnline: true, isBusy: false }); } catch (_) {}
      try { const chan = new BroadcastChannel('doctorStatus'); chan.postMessage({ uid, online: true, busy: false }); chan.close(); } catch(_) {}
    } else if (status === "offline") {
      localStorage.setItem(`doctorOnlineById_${uid}`, "0");
      localStorage.setItem(`doctorBusyById_${uid}`, "0");
      setOnline(false);
      setBusy(false);
      try { await API.put('/doctors/me/status', { isOnline: false, isBusy: false }); } catch (_) {}
      try { const chan = new BroadcastChannel('doctorStatus'); chan.postMessage({ uid, online: false, busy: false }); chan.close(); } catch(_) {}
    } else {
      localStorage.setItem(`doctorBusyById_${uid}`, "1");
      localStorage.setItem(`doctorOnlineById_${uid}`, "1");
      setOnline(true);
      setBusy(true);
      try { await API.put('/doctors/me/status', { isOnline: true, isBusy: true }); } catch (_) {}
      try { const chan = new BroadcastChannel('doctorStatus'); chan.postMessage({ uid, online: true, busy: true }); chan.close(); } catch(_) {}
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/doctor/dashboard" className="flex items-center gap-4 group hover:scale-105 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-white/20">
              <div className="text-white">
                <Logo size={20} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                HospoZen
              </span>
              
            </div>
          </Link>
          <nav className="flex items-center gap-6 ml-6 text-slate-700">
            <Link to="/doctor/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/doctor/appointments" className="nav-link">Appointments</Link>
            <Link to="/doctor/profile" className="nav-link text-indigo-700 font-semibold">Profile</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { localStorage.removeItem("token"); nav("/doctor/login"); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-12">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Doctor Profile</h1>
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
                    onClick={() => setStatus(online ? "offline" : "online")}
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
