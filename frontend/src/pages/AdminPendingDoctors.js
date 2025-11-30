import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Logo from "../components/Logo";

export default function AdminPendingDoctors() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setError("");
      const { data } = await API.get("/admin/pending-doctors");
      setList(data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      await API.post(`/admin/doctors/${id}/approve`);
      await load();
    } catch (e) { setError(e.response?.data?.message || e.message || "Network Error"); }
  };

  const reject = async (id) => {
    const reason = prompt("Enter rejection reason");
    try {
      await API.post(`/admin/doctors/${id}/reject`, { reason });
      await load();
    } catch (e) { setError(e.response?.data?.message || e.message || "Network Error"); }
  };

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
            <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Approvals</div>
            <Link to="/admin/doctors" className="block px-3 py-2 rounded-md hover:bg-slate-50">Doctors List</Link>
          </nav>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-semibold">Pending Doctor Approvals</h2>
          <button
            onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
          >
            Logout
          </button>
        </div>
        {error && <p className="text-red-600 mb-3">{error}</p>}
        {loading && <p className="text-slate-600">Loading...</p>}
        <div className="space-y-4">
          {list.map((row) => (
            <div key={row.user._id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{row.user.name}</div>
                  <div className="text-sm text-slate-600">{row.user.email}</div>
                </div>
                <div className="text-sm text-slate-700">Clinic: {row.profile?.clinic?.name || "--"}</div>
              </div>
              <div className="text-sm text-slate-700 mt-2">Specializations: {row.profile?.specializations?.join(", ") || "--"}</div>
              <div className="mt-3 flex gap-3">
                <button onClick={() => approve(row.user._id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md">Approve</button>
                <button onClick={() => reject(row.user._id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  </div>
);
}
