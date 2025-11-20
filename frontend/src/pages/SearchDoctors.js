import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api";

const SPECIALTIES = [
  "General Physician",
  "Gynecologist",
  "Dermatologist",
  "Pediatrician",
  "Neurologist",
  "Cardiologist",
];

export default function SearchDoctors() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const CARD_FALLBACK = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=640&auto=format&fit=crop";

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

  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-indigo-700 font-semibold mb-4">Prescripto</div>
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
                  <img
                    src={d.photoBase64 || ((process.env.PUBLIC_URL || "") + "/doctor3.jpeg")}
                    alt="Doctor"
                    className="w-full h-56 object-cover"
                    onError={(e) => { if (e.currentTarget.src !== CARD_FALLBACK) e.currentTarget.src = CARD_FALLBACK; }}
                  />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold">{`Dr. ${d.user?.name || ''}`}</h3>
                    <p className="text-sm text-slate-600">{(d.specializations && d.specializations[0]) || "--"}</p>
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

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-3xl font-semibold mb-6">All Doctors</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-3">Browse through the doctors specialties.</p>
            <div className="space-y-2">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialization(s)}
                  className={`w-full text-left px-3 py-2 rounded-md border ${
                    specialization === s
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => setSpecialization("")}
                className="w-full text-left px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
              >
                Clear filter
              </button>
            </div>
            <div className="mt-4">
          <input
            className="w-full border border-slate-300 rounded-md p-2"
            placeholder="Search doctor or specialization"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          />
              <button
                onClick={search}
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
              >
                Search
              </button>
            </div>
          </div>
        </aside>
        <main className="md:col-span-3">
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((d) => (
              <div key={d._id} className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={d.photoBase64 || ((process.env.PUBLIC_URL || "") + "/doctor3.jpeg")}
                    alt="Doctor"
                    className="w-full h-56 object-cover"
                    onError={(e) => { if (e.currentTarget.src !== CARD_FALLBACK) e.currentTarget.src = CARD_FALLBACK; }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold">{`Dr. ${d.user?.name || ''}`}</h3>
                  <p className="text-sm text-slate-600">{(d.specializations && d.specializations[0]) || "--"}</p>
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