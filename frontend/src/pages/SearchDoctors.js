import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import API from "../api";

const SPECIALTIES = [
  "General Physician",
  "Dermatologist",
  "Gynecologist",
  "Pediatrician",
  "Orthopedic Surgeon",
  "Cardiologist",
  "Neurologist",
  "Gastroenterologist",
  "ENT Specialist",
  "Dentist",
  "Psychiatrist",
  "Diabetologist",
  "Endocrinologist",
  "Pulmonologist",
  "Nephrologist",
  "Urologist",
  "Ophthalmologist",
  "Oncologist",
  "Rheumatologist",
  "Physiotherapist",
];

export default function SearchDoctors() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const CARD_FALLBACK = "";

  const getOnlineStatus = (id) => {
    const v = localStorage.getItem(`doctorOnlineById_${id}`);
    return v === "1";
  };
  const getBusyStatus = (id) => {
    const v = localStorage.getItem(`doctorBusyById_${id}`);
    return v === "1";
  };

  const photoOf = (d) => {
    let s = String(d?.photoBase64 || "").trim();
    if (!s) return "";
    if (s.startsWith("data:")) return s;
    if (s.startsWith("http")) return s;
    return `data:image/png;base64,${s}`;
  };

  const search = async () => {
    setError("");
    try {
      const { data } = await API.get("/doctors", { params: { q, specialization } });
      let items = Array.isArray(data) ? data : [];

      if (q && String(q).trim().length > 0) {
        const norm = String(q).trim().toLowerCase();
        items = items.filter((d) => {
          const name = String(d.user?.name || "").toLowerCase();
          const clinic = String(d.clinic?.name || "").toLowerCase();
          const specs = (d.specializations || []).map((s) => String(s).toLowerCase());
          return name.includes(norm) || clinic.includes(norm) || specs.some((s) => s.includes(norm));
        });
      }

      if (specialization) {
        const norm = specialization.trim().toLowerCase();
        const hasMatches = items.some((d) => (d.specializations || []).some((s) => String(s).toLowerCase().includes(norm)));
        if (!hasMatches) {
          const all = await API.get("/doctors");
          const arr = Array.isArray(all.data) ? all.data : [];
          items = arr.filter((d) => (d.specializations || []).some((s) => String(s).toLowerCase().includes(norm)));
        } else {
          items = items.filter((d) => (d.specializations || []).some((s) => String(s).toLowerCase().includes(norm)));
        }
      }

      setList(items);
    } catch (e) {
      setList([]);
      setError(e.response?.data?.message || e.message || "Network Error");
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialization]);

  useEffect(() => {
    const t = setTimeout(() => { search(); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const iv = setInterval(() => { search(); }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, specialization]);

  useEffect(() => {
    const cleanup = [];
    const initSocket = () => {
      const origin = String(API.defaults.baseURL || "").replace(/\/(api)?$/, "");
      const w = window;
      const onReady = () => {
        try {
          const socket = w.io ? w.io(origin, { transports: ["websocket", "polling"] }) : null;
          if (socket) {
            socket.on('doctor:status', (p) => {
              const did = String(p?.doctorId || "");
              if (!did) return;
              setList((prev) => prev.map((d) => (
                String(d?.user?._id || "") === did ? { ...d, isOnline: !!p.isOnline, isBusy: !!p.isBusy } : d
              )));
            });
            cleanup.push(() => { try { socket.close(); } catch(_) {} });
          }
        } catch (_) {}
      };
      if (!w.io) {
        const s = document.createElement('script');
        s.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
        s.onload = onReady;
        document.body.appendChild(s);
        cleanup.push(() => { try { document.body.removeChild(s); } catch(_) {} });
      } else {
        onReady();
      }
    };
    initSocket();
    return () => { cleanup.forEach((fn) => fn()); };
  }, []);

  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto mt-8 px-4">
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
                <Link to="/admin/dashboard" className="block px-3 py-2 rounded-md hover:bg-slate-50">Dashboard</Link>
                <Link to="/admin/appointments" className="block px-3 py-2 rounded-md hover:bg-slate-50">Appointments</Link>
                <Link to="/admin/add-doctor" className="block px-3 py-2 rounded-md hover:bg-slate-50">Add Doctor</Link>
                
                <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Doctors List</div>
              </nav>
            </div>
          </aside>
          <main className="col-span-12 md:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-semibold">Doctors List</h2>
              <button
                onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
              >
                Logout
              </button>
            </div>
            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((d) => (
                <div key={d._id} className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                  <div className="relative">
                  {photoOf(d) ? (
                    <img
                      src={photoOf(d)}
                      alt="Doctor"
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 bg-white" />
                  )}
                  <div className="absolute top-2 right-2">
                  {(() => {
                      const online = typeof d.isOnline === 'boolean' ? d.isOnline : null;
                      const busy = typeof d.isBusy === 'boolean' ? d.isBusy : null;
                      if (online === null && busy === null) return null;
                      const cls = busy ? 'bg-amber-100 text-amber-700' : (online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');
                      const txt = busy ? 'Busy' : (online ? 'Online' : 'Offline');
                      return <span className={`inline-block text-xs px-2 py-1 rounded ${cls}`}>{txt}</span>;
                    })()}
                  </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold">{`Dr. ${d.user?.name || ''}`}</h3>
                    <p className="text-sm text-slate-600">{(d.specializations && d.specializations[0]) || ""}</p>
                    {typeof d.consultationFees === 'number' && (
                      <div className="text-sm text-slate-700">Fee: ₹{d.consultationFees}</div>
                    )}
                    <Link to={`/admin/doctors/${d.user._id}`} className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">View Profile</Link>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-semibold mb-6">All Doctors</h2>
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="border border-slate-300 rounded-md p-2 w-full"
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-300 rounded-md p-2"
                placeholder="Search doctor or specialization"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              />
              <button onClick={search} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">Search</button>
              <button
                onClick={() => { setQ(''); setSpecialization(''); search(); }}
                className="px-4 py-2 rounded-md border border-slate-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <main>
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((d) => (
              <div key={d._id} className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                <div className="relative">
                  {photoOf(d) ? (
                    <img
                      src={photoOf(d)}
                      alt="Doctor"
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 bg-white" />
                  )}
                  <div className="absolute top-2 right-2">
                    {(() => {
                      const online = typeof d.isOnline === 'boolean' ? d.isOnline : null;
                      const busy = typeof d.isBusy === 'boolean' ? d.isBusy : null;
                      if (online === null && busy === null) return null;
                      const cls = busy ? 'bg-amber-100 text-amber-700' : (online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700');
                      const txt = busy ? 'Busy' : (online ? 'Online' : 'Offline');
                      return <span className={`inline-block text-xs px-2 py-1 rounded ${cls}`}>{txt}</span>;
                    })()}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold">{`Dr. ${d.user?.name || ''}`}</h3>
                  <p className="text-sm text-slate-600">{(d.specializations && d.specializations[0]) || ""}</p>
                  {typeof d.consultationFees === 'number' && (
                    <div className="text-sm text-slate-700">Fee: ₹{d.consultationFees}</div>
                  )}
                  <Link to={`/doctor/${d.user._id}`} className="mt-3 inline-block text-indigo-600 hover:text-indigo-800">View Profile</Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
