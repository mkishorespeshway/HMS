import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function DoctorToday() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/appointments/today");
      let items = data || [];
      if (!items.length) {
        try {
          const mine = await API.get("/appointments/mine");
          const todayStr = new Date().toISOString().slice(0, 10);
          items = (mine.data || []).filter((a) => a.date === todayStr);
        } catch (_) {}
      }
      setList(items);
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accept = async (id, date, startTime) => {
    const apptId = id || "";
    if (!apptId) { alert("Invalid appointment"); return; }
    try {
      await API.put(`/appointments/${String(apptId)}/accept`, { date, startTime });
      load();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Failed to accept";
      if (e.response?.status === 404) {
        alert("Appointment not found");
        await load();
      } else {
        alert(msg);
      }
    }
  };

  const reject = async (id, date, startTime) => {
    const apptId = id || "";
    if (!apptId) { alert("Invalid appointment"); return; }
    try {
      await API.put(`/appointments/${String(apptId)}/reject`, { date, startTime });
      load();
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Failed to reject";
      if (e.response?.status === 404) {
        alert("Appointment not found");
        await load();
      } else {
        alert(msg);
      }
    }
  };

  const rows = list.length
    ? list.map((a, i) => (
        <tr key={a._id} className="border-t">
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3">{a.patient?.name || "User"}</td>
          <td className="px-4 py-3">
            <span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{a.type === "offline" ? "Cash" : "Online"}</span>
          </td>
          <td className="px-4 py-3">--</td>
          <td className="px-4 py-3">{a.date} {a.startTime}</td>
          <td className="px-4 py-3">₹{a.fee || 0}</td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => accept(a._id || a.id, a.date, a.startTime)}
                disabled={!(a?._id || a?.id)}
                className={`h-7 w-7 rounded-full flex items-center justify-center ${(a?._id || a?.id) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-200 text-slate-500"}`}
                title="Accept"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => reject(a._id || a.id, a.date, a.startTime)}
                disabled={!(a?._id || a?.id)}
                className={`h-7 w-7 rounded-full flex items-center justify-center ${(a?._id || a?.id) ? "bg-red-600 hover:bg-red-700 text-white" : "bg-slate-200 text-slate-500"}`}
                title="Reject"
              >
                ✕
              </button>
            </div>
          </td>
        </tr>
      ))
    : [1, 2].map((i) => (
        <tr key={i} className="border-t">
          <td className="px-4 py-3">{i}</td>
          <td className="px-4 py-3">User {i}</td>
          <td className="px-4 py-3"><span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">Cash</span></td>
          <td className="px-4 py-3">22</td>
          <td className="px-4 py-3">Nov 25th, 10:30 am</td>
          <td className="px-4 py-3">₹500</td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button type="button" className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md">Accept</button>
              <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md">Reject</button>
            </div>
          </td>
        </tr>
      ));

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-indigo-700 font-semibold mb-4">Prescripto</div>
            <nav className="space-y-2 text-slate-700">
              <Link to="/doctor/dashboard" className="block px-3 py-2 rounded-md hover:bg-slate-50">Dashboard</Link>
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Appointments</div>
              <Link to="/doctor/profile" className="block px-3 py-2 rounded-md hover:bg-slate-50">Profile</Link>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold">Doctor Appointments</h1>
            <button
              onClick={() => { localStorage.removeItem("token"); nav("/doctor/login"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Payment</th>
                    <th className="px-4 py-3 text-left">Age</th>
                    <th className="px-4 py-3 text-left">Date & Time</th>
                    <th className="px-4 py-3 text-left">Fee</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-600">Loading...</td>
                    </tr>
                  ) : (
                    rows
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}