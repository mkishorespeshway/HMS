import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import API from "../api";

export default function AdminAppointments() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setError("");
        const { data } = await API.get("/admin/appointments");
        setList(data || []);
      } catch (e) {
        setList([]);
        setError(e.response?.data?.message || e.message || "Failed to load appointments");
      }
      setLoading(false);
    };
    load();
  }, []);

  const rank = (s) => {
    const x = String(s || "").toUpperCase();
    if (x === "PENDING") return 0;
    if (x === "CONFIRMED" || x === "COMPLETED") return 1;
    if (x === "CANCELLED" || x === "CANCELED") return 2;
    return 3;
  };
  const ordered = list.slice().sort((a, b) => rank(a.status) - rank(b.status));
  const rows = ordered.length
    ? ordered.map((a, i) => (
        <tr key={a._id} className="border-t">
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3">{a.patient?.name || "User"}</td>
          <td className="px-4 py-3">{(() => {
            const p = a.patient || {};
            if (p.age !== undefined && p.age !== null && p.age !== "") return p.age;
            const pid = String(p._id || a.patient || "");
            const locAge = localStorage.getItem(`userAgeById_${pid}`) || "";
            if (locAge) return String(locAge);
            const dob = p.birthday || p.dob || p.dateOfBirth || localStorage.getItem(`userDobById_${pid}`) || "";
            if (!dob) return "";
            const b = new Date(dob);
            if (Number.isNaN(b.getTime())) return "";
            const today = new Date();
            let age = today.getFullYear() - b.getFullYear();
            const m = today.getMonth() - b.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
            return String(age);
          })()}</td>
          <td className="px-4 py-3">{a.date} {a.startTime}</td>
          <td className="px-4 py-3">{a.doctor?.name || "--"}</td>
          <td className="px-4 py-3">₹{a.fee || 0}</td>
          <td className="px-4 py-3">
            <span className={`badge ${String(a.status || '').toUpperCase()==='PENDING' ? 'badge-busy' : ((String(a.status || '').toUpperCase()==='CANCELLED' || String(a.status || '').toUpperCase()==='CANCELED') ? 'badge-offline' : 'badge-online')}`}>
              {a.status}
            </span>
          </td>
        </tr>
      ))
    : (
        <tr>
          <td colSpan={7} className="px-4 py-6 text-center text-slate-600">No appointments found</td>
        </tr>
      );

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">All Appointments</h1>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Date & Time</th>
                    <th className="px-4 py-3 text-left">Doctor Name</th>
                    <th className="px-4 py-3 text-left">Fee</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-600">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-red-600">{error}</td>
                    </tr>
                  ) : (
                    rows
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
