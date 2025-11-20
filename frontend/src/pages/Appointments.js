import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Appointments() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { nav("/login"); return; }
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get("/appointments/mine");
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Failed to load");
      }
      setLoading(false);
    };
    load();
  }, [nav]);

  const cancel = async (id) => {
    try {
      const apptId = id || "";
      await API.put(`/appointments/${apptId}/cancel`);
      setList((prev) => prev.filter((x) => String(x._id) !== String(apptId)));
    } catch (e) {
      const msg = e.response?.data?.message || e.message || "Cancel failed";
      if (e.response?.status === 404) {
        alert("Appointment not found or already cancelled");
        setList((prev) => prev.filter((x) => String(x._id) !== String(id)));
      } else {
        alert(msg);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <h1 className="text-2xl font-semibold mb-4">My appointments</h1>
      <div className="bg-white border border-slate-200 rounded-xl">
        {loading ? (
          <div className="p-4 text-slate-600">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : list.length === 0 ? (
          <div className="p-4 text-slate-600">No appointments found</div>
        ) : (
          <div className="divide-y">
            {list.map((a) => (
              <div key={a._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={(a.doctor?.photoBase64) || ((process.env.PUBLIC_URL || "") + "/doctor3.jpeg")}
                    alt="Doctor"
                    className="h-14 w-14 rounded-md object-cover border"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=128&auto=format&fit=crop"; }}
                  />
                  <div>
                    <div className="font-semibold">{`Dr. ${a.doctor?.name || "Doctor"}`}</div>
                    <div className="text-sm text-slate-600">{a.doctor?.specializations?.[0] || "General physician"}</div>
                    <div className="text-sm text-slate-700">Address: <span className="text-slate-900">{a.doctor?.clinic?.address || "--"}</span></div>
                    <div className="text-sm text-slate-700">Date & Time: <span className="text-slate-900">{`${a.date} | ${a.startTime}`}</span></div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => nav(`/pay/${a._id}`)}
                    className="border border-slate-300 px-3 py-1 rounded-md"
                  >
                    Pay Online
                  </button>
                  <button onClick={() => cancel(a._id || a.id)} className="border border-slate-300 px-3 py-1 rounded-md">Cancel appointment</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-lg">Prescripto</div>
            <p className="mt-3 text-slate-600 text-sm">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900 mb-2">COMPANY</div>
            <div className="space-y-1 text-slate-700 text-sm">
              <Link to="/" className="hover:text-indigo-700">Home</Link>
              <div>
                <Link to="/about" className="hover:text-indigo-700">About us</Link>
              </div>
              <div className="text-slate-700">Delivery</div>
              <div className="text-slate-700">Privacy policy</div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-slate-900 mb-2">GET IN TOUCH</div>
            <div className="text-slate-700 text-sm">+1-212-456-7890</div>
            <div className="text-slate-700 text-sm">greatstackdev@gmail.com</div>
          </div>
        </div>
        <hr className="my-6 border-slate-200" />
        <div className="text-center text-slate-600 text-sm">Copyright 2024 © Prescripto.com - All Right Reserved.</div>
      </div>
    </div>
  );
}