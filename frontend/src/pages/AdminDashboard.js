import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [latest, setLatest] = useState([]);
  const rank = (s) => {
    const x = String(s || "").toUpperCase();
    if (x === "PENDING") return 0;
    if (x === "CONFIRMED" || x === "COMPLETED") return 1;
    if (x === "CANCELLED" || x === "CANCELED") return 2;
    return 3;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const d = await API.get("/doctors");
        setDoctorCount(d.data?.length || 0);

        const a = await API.get("/admin/appointments");
        const list = a.data || [];
        setAppointmentCount(list.length);
        const setIds = new Set(list.map((x) => x.patient?._id || String(x.patient || "")));
        setPatientCount(setIds.size);
        const ordered = list.slice().sort((u, v) => rank(u.status) - rank(v.status));
        setLatest(ordered.slice(0, 5));
      } catch (e) {}
    };
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="#0EA5E9"/>
                  <path d="M12 7v10M7 12h10" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>HospoZen</span>
              </div>
            </div>
            <nav className="space-y-2 text-slate-700">
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Dashboard</div>
              <Link to="/admin/appointments" className="block px-3 py-2 rounded-md hover:bg-slate-50">Appointments</Link>
              <Link to="/admin/add-doctor" className="block px-3 py-2 rounded-md hover:bg-slate-50">Add Doctor</Link>
              
              <Link to="/admin/doctors" className="block px-3 py-2 rounded-md hover:bg-slate-50">Doctors List</Link>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4 transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:bg-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">👨‍⚕️</div>
                  <div className="text-sm text-slate-600">Doctors</div>
                </div>
                <div className="text-2xl font-semibold animate-pulse">{doctorCount}</div>
              </div>
            </div>
            <div className="relative flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4 transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:bg-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">📅</div>
                  <div className="text-sm text-slate-600">Appointments</div>
                </div>
                <div className="text-2xl font-semibold animate-pulse">{appointmentCount}</div>
              </div>
            </div>
            <div className="relative flex-1 min-w-[160px] bg-white border border-slate-200 rounded-xl p-4 transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:bg-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">👥</div>
                  <div className="text-sm text-slate-600">Patients</div>
                </div>
                <div className="text-2xl font-semibold animate-pulse">{patientCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-slate-900 font-semibold mb-3">Latest Bookings</div>
            {latest && latest.length ? (
              <div className="divide-y">
                {latest.map((b) => (
                  <div key={String(b._id)} className="flex items-center justify-between py-2 hover:bg-slate-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const pid = String(b.patient?._id || b.patient || "");
                        let img = String(b.patient?.photoBase64 || localStorage.getItem(`userPhotoBase64ById_${pid}`) || "");
                        let src = img;
                        if (img && !img.startsWith("data:") && !img.startsWith("http")) {
                          src = `data:image/png;base64,${img}`;
                        }
                        const ok = src.startsWith("data:") || src.startsWith("http");
                        return ok ? (
                          <img src={src} alt="Patient" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full border bg-white" />
                        );
                      })()}
                      <div>
                        <div className="text-slate-900 text-sm">{b.patient?.name || "Patient"}</div>
                        <div className="text-slate-600 text-xs">with {b.doctor?.name ? `Dr. ${b.doctor.name}` : "Doctor"}</div>
                        <div className="text-slate-600 text-xs">{(() => {
                          const p = b.patient || {};
                          if (p.age !== undefined && p.age !== null && p.age !== "") return `Age: ${p.age}`;
                          const dob = p.birthday || p.dob || p.dateOfBirth || "";
                          if (!dob) return "";
                          const d = new Date(dob);
                          if (Number.isNaN(d.getTime())) return "";
                          const t = new Date();
                          let age = t.getFullYear() - d.getFullYear();
                          const m = t.getMonth() - d.getMonth();
                          if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
                          return `Age: ${age}`;
                        })()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-slate-700 text-sm">{b.date} {b.startTime}</div>
                      <span className={`text-xs px-2 py-1 rounded ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-600 text-sm">No recent bookings</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
