import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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

  const linkClass = (active) =>
    active
      ? "relative px-4 py-2 text-blue-700 font-bold bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm"
      : "relative px-4 py-2 text-gray-600 hover:text-blue-600 font-medium rounded-xl hover:bg-blue-50/50 transition-all duration-300 hover:scale-105";

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xl border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo Section */}
            <Link to="/admin/dashboard" className="flex items-center gap-4 group hover:scale-105 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-white/20">
                <div className="text-white">
                  <Logo size={20} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  HospoZen
                </span>
              </div>
            </Link>

            {/* Enhanced Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              {(() => {
                const p = window.location.pathname;
                return (
                  <>
                    <Link to="/admin/dashboard" className={linkClass(p === "/admin/dashboard")}>
                      <span className="relative z-10">Dashboard</span>
                      {p === "/admin/dashboard" && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                    <Link to="/admin/appointments" className={linkClass(p.startsWith("/admin/appointments"))}>
                      <span className="relative z-10">Appointments</span>
                      {p.startsWith("/admin/appointments") && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                    <Link to="/admin/add-doctor" className={linkClass(p.startsWith("/admin/add-doctor"))}>
                      <span className="relative z-10">Add Doctor</span>
                      {p.startsWith("/admin/add-doctor") && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>

                    <Link to="/admin/doctors" className={linkClass(p.startsWith("/admin/doctors") && !p.startsWith("/admin/doctors/pending"))}>
                      <span className="relative z-10">Doctors List</span>
                      {(p.startsWith("/admin/doctors") && !p.startsWith("/admin/doctors/pending")) && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                  </>
                );
              })()}
            </nav>

            {/* Enhanced User Actions */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Mobile Menu Button */}
              <button
                className="lg:hidden p-3 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-white/20"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden bg-white/98 backdrop-blur-md border-t border-blue-200/50 py-6">
              <nav className="flex flex-col space-y-4 px-6">
                {[
                  { path: '/admin/dashboard', label: 'Dashboard' },
                  { path: '/admin/appointments', label: 'Appointments' },
                  { path: '/admin/add-doctor', label: 'Add Doctor' },
                  { path: '/admin/doctors', label: 'Doctors List' }
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      window.location.pathname === item.path
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 hover:scale-105'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Logout Button */}
              <div className="flex flex-col space-y-3 px-6 mt-6 pt-6 border-t border-blue-200/50">
                <button
                  onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); setMobileOpen(false); }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl text-center border-2 border-white/20"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="pt-16 px-6 page-gradient">
        <div className="max-w-7xl mx-auto">
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
                  <div key={String(b._id)} className="flex items-center justify-between py-2 card-hover">
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
                      <span className={`badge ${b.status === 'CONFIRMED' ? 'badge-online' : b.status === 'CANCELLED' ? 'badge-offline' : 'badge-busy'}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-600 text-sm">No recent bookings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
