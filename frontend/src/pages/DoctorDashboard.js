import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function DoctorDashboard() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestToday, setLatestToday] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setError("");
        const uid = localStorage.getItem("userId");

        const getFromAdmin = async () => {
          try {
            const all = await API.get("/admin/appointments");
            return (all.data || []).filter((x) => String(x.doctor?._id || x.doctor) === String(uid));
          } catch (e) {
            return [];
          }
        };

        let items = [];
        try {
          const mine = await API.get("/appointments/mine");
          items = mine.data || [];
        } catch (eMine) {
          items = await getFromAdmin();
        }

        if (!items.length) {
          const alt = await getFromAdmin();
          if (alt.length) items = alt;
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const filtered = (items || []).filter((a) => a.date === todayStr);
        setLatestToday(filtered);

        setList(items);
      } catch (e) {
        setList([]);
        setError(e.response?.data?.message || e.message || "Failed to load dashboard");
      }
      setLoading(false);
    };
    load();
  }, []);

  const accept = async (id) => {
    if (!id) return;
    try {
      await API.put(`/appointments/${id}/accept`);
      setList((prev) => prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, status: "CONFIRMED" } : a)));
      const todayStr = new Date().toISOString().slice(0, 10);
      setLatestToday((prev) => prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, status: "CONFIRMED" } : a)).filter((a) => a.date === todayStr));
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to accept");
    }
  };

  const reject = async (id) => {
    if (!id) return;
    try {
      await API.put(`/appointments/${id}/reject`);
      setList((prev) => prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, status: "CANCELLED" } : a)));
      const todayStr = new Date().toISOString().slice(0, 10);
      setLatestToday((prev) => prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, status: "CANCELLED" } : a)).filter((a) => a.date === todayStr));
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Failed to reject");
    }
  };

  const stats = useMemo(() => {
    const patients = new Set();
    let earnings = 0;
    (list || []).forEach((a) => {
      if (a.patient?._id) patients.add(a.patient._id);
      if (a.paymentStatus === "PAID" || a.status === "COMPLETED") earnings += Number(a.fee || 0);
    });
    return { appointments: list.length, patients: patients.size, earnings };
  }, [list]);

  const latest = useMemo(() => {
    const src = latestToday.length ? latestToday : list;
    const copy = [...src];
    copy.sort((x, y) => (y.date + y.startTime).localeCompare(x.date + x.startTime));
    return copy.slice(0, 4);
  }, [list, latestToday]);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-indigo-700 font-semibold mb-4">Prescripto</div>
            <nav className="space-y-2 text-slate-700">
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Dashboard</div>
              <Link to="/doctor/today" className="block px-3 py-2 rounded-md hover:bg-slate-50">Appointments</Link>
              <Link to="/doctor/profile" className="block px-3 py-2 rounded-md hover:bg-slate-50">Profile</Link>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Doctor Dashboard</h1>
            <button
              onClick={() => { localStorage.removeItem("token"); nav("/doctor/login"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1C6.477 1 2 5.477 2 11s4.477 10 10 10 10-4.477 10-10S17.523 1 12 1zm1 5v2h2a1 1 0 110 2h-2v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2V10H9a1 1 0 110-2h2V6a1 1 0 112 0z" fill="#4F46E5"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Earnings</div>
                  <div className="text-2xl font-semibold">₹{stats.earnings}</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 2a1 1 0 000 2h1v2h8V4h1a1 1 0 100-2H7zM5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2H5zm3 3h8v2H8v-2zm0 4h8v2H8v-2z" fill="#0EA5E9"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Appointments</div>
                  <div className="text-2xl font-semibold">{stats.appointments}</div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z" fill="#06B6D4"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Patients</div>
                  <div className="text-2xl font-semibold">{stats.patients}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2a1 1 0 000 2h1v2h8V4h1a1 1 0 100-2H7zM5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2H5zm3 3h8v2H8v-2zm0 4h8v2H8v-2z" fill="#4B5563"/>
              </svg>
              <span>Latest Bookings</span>
            </div>
            {loading && <div className="text-slate-600">Loading...</div>}
            {error && !loading && <div className="text-red-600 mb-3 text-sm">{error}</div>}
            <div className="space-y-3">
              {latest.length === 0 && !loading ? (
                <div className="text-slate-600">No recent bookings</div>
              ) : (
                latest.map((a) => (
                  <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={a.patient?.photoBase64 || ((process.env.PUBLIC_URL || "") + "/doctor3.jpeg")}
                        alt="User"
                        className="h-8 w-8 rounded-full object-cover border"
                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=64&auto=format&fit=crop"; }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{a.patient?.name || "User"}</div>
                        <div className="text-xs text-slate-600">Booking on {new Date(a.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                    </div>
                    {String(a.status).toUpperCase() === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => accept(a._id || a.id)}
                          className="h-6 w-6 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                          title="Accept"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => reject(a._id || a.id)}
                          className="h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                          title="Reject"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded ${String(a.status).toUpperCase() === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                      >
                        {String(a.status || "COMPLETED").toUpperCase() === "CANCELLED" ? "Cancelled" : "Completed"}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}