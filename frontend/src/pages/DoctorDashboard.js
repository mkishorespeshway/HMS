import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function DoctorDashboard() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [latestToday, setLatestToday] = useState([]);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [followAppt, setFollowAppt] = useState(null);
  const [fuChat, setFuChat] = useState([]);
  const [fuFiles, setFuFiles] = useState([]);
  const [fuText, setFuText] = useState("");
  const [profile, setProfile] = useState(null);
  const [expiredAppt, setExpiredAppt] = useState(null);

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
        let filtered = (items || []).filter((a) => a.date === todayStr);
        try {
          const todayRes = await API.get('/appointments/today');
          const todayList = todayRes.data || [];
          if (Array.isArray(todayList) && todayList.length) {
            filtered = todayList;
          }
        } catch (eToday) {}
        setLatestToday(filtered);

        setList(items);
        try {
          if (uid) {
            const profs = await API.get(`/doctors?user=${uid}`);
            const first = Array.isArray(profs?.data) ? profs.data[0] : null;
            setProfile(first || null);
          }
        } catch (_) {}
      } catch (e) {
        setList([]);
        setError(e.response?.data?.message || e.message || "Failed to load dashboard");
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    const v = localStorage.getItem(`doctorOnlineById_${uid}`) === "1";
    const b = localStorage.getItem(`doctorBusyById_${uid}`) === "1";
    setOnline(v);
    setBusy(b);
    if (uid) {
      API.get('/doctors', { params: { user: uid } }).then((res) => {
        const prof = Array.isArray(res.data) ? res.data[0] : null;
        if (prof && typeof prof.isOnline === 'boolean') setOnline(!!prof.isOnline);
        if (prof && typeof prof.isBusy === 'boolean') setBusy(!!prof.isBusy);
      }).catch(() => {});
    }
  }, []);

  const setStatus = async (status) => {
    const uid = localStorage.getItem("userId") || "";
    if (status === "online") {
      localStorage.setItem(`doctorOnlineById_${uid}`, "1");
      localStorage.setItem(`doctorBusyById_${uid}`, "0");
      setOnline(true);
      setBusy(false);
      try { await API.put('/doctors/me/status', { isOnline: true, isBusy: false }); } catch (_) {}
    } else if (status === "offline") {
      localStorage.setItem(`doctorOnlineById_${uid}`, "0");
      localStorage.setItem(`doctorBusyById_${uid}`, "0");
      setOnline(false);
      setBusy(false);
      try { await API.put('/doctors/me/status', { isOnline: false, isBusy: false }); } catch (_) {}
    } else {
      localStorage.setItem(`doctorBusyById_${uid}`, "1");
      localStorage.setItem(`doctorOnlineById_${uid}`, "1");
      setOnline(true);
      setBusy(true);
      try { await API.put('/doctors/me/status', { isOnline: true, isBusy: true }); } catch (_) {}
    }
  };

  const addNotif = (text) => {
    const id = String(Date.now()) + String(Math.random());
    setNotifs((prev) => [{ id, text }, ...prev].slice(0, 4));
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { try { osc.stop(); ctx.close(); } catch(_) {} }, 450);
    } catch (_) {}
    setTimeout(() => { setNotifs((prev) => prev.filter((n) => n.id !== id)); }, 6000);
  };

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    const cleanup = [];
    const initSocket = () => {
      const origin = String(API.defaults.baseURL || "").replace(/\/(api)?$/, "");
      const w = window;
      const onReady = () => {
        try {
          const socket = w.io ? w.io(origin, { transports: ["websocket", "polling"], auth: { token: localStorage.getItem("token") || "" } }) : null;
          if (socket) {
            socket.on("appointment:new", (a) => {
              try {
                const did = String(a?.doctor?._id || a?.doctor || "");
                if (did !== String(uid)) return;
                const key = String(a._id || a.id || "");
                const seen = new Set([...(list || []), ...(latestToday || [])].map((x) => String(x._id || x.id || "")));
                if (seen.has(key)) return;
                addNotif(`New appointment booked at ${a.startTime || "--:--"}`);
                setLatestToday((prev) => [a, ...prev]);
                setList((prev) => [a, ...prev]);
              } catch (_) {}
            });
            cleanup.push(() => { try { socket.close(); } catch(_) {} });
          }
        } catch (_) {}
      };
      if (!w.io) {
        const s = document.createElement("script");
        s.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
        s.onload = onReady;
        document.body.appendChild(s);
        cleanup.push(() => { try { document.body.removeChild(s); } catch(_) {} });
      } else {
        onReady();
      }
    };
    initSocket();

    const poll = setInterval(async () => {
      try {
        const todayRes = await API.get("/appointments/today");
        let items = Array.isArray(todayRes.data) ? todayRes.data : [];
        items = items.filter((x) => String(x.doctor?._id || x.doctor || "") === String(uid));
        const seen = new Set([...(list || []), ...(latestToday || [])].map((x) => String(x._id || x.id || "")));
        for (const a of items) {
          const key = String(a._id || a.id || "");
          if (!seen.has(key)) {
            addNotif(`New appointment booked at ${a.startTime || "--:--"}`);
            setLatestToday((prev) => [a, ...prev]);
            setList((prev) => [a, ...prev]);
          }
        }
      } catch (_) {}
    }, 10000);

    return () => { cleanup.forEach((fn) => fn()); clearInterval(poll); };
  }, [list, latestToday]);

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

  const apptStartTs = (a) => {
    try {
      const d = new Date(a.date);
      const [hh, mm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
      d.setHours(hh, mm, 0, 0);
      return d.getTime();
    } catch (_) { return 0; }
  };

  const apptEndTs = (a) => {
    try {
      const d = new Date(a.date);
      const [hh, mm] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
      d.setHours(hh, mm, 0, 0);
      return d.getTime();
    } catch (_) { return apptStartTs(a); }
  };

  const canFollowUp = (a) => {
    if (!a || !a.prescriptionText) return false;
    const ts = apptStartTs(a);
    const now = Date.now();
    const diff = now - ts;
    const max = 5 * 24 * 60 * 60 * 1000; // up to 5 days after appointment
    return diff >= 0 && diff <= max;
  };

  const isExpired = (a) => {
    const ts = apptEndTs(a);
    return Date.now() > ts;
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

  const upcoming = useMemo(() => {
    const now = Date.now();
    const arr = (list || []).filter((a) => {
      const s = String(a.status).toUpperCase();
      if (a.type !== 'online') return false;
      if (!(s === "PENDING" || s === "CONFIRMED")) return false;
      const ts = apptStartTs(a);
      return ts > now;
    });
    arr.sort((x, y) => apptStartTs(x) - apptStartTs(y));
    return arr.slice(0, 6);
  }, [list]);

  const completed = useMemo(() => {
    const arr = (list || []).filter((a) => a.type === 'online' && String(a.status).toUpperCase() === "COMPLETED");
    arr.sort((x, y) => apptStartTs(y) - apptStartTs(x));
    return arr.slice(0, 6);
  }, [list]);

  const latest = useMemo(() => {
    const mergedAll = [...(list || []), ...(latestToday || [])];
    const seen = new Set();
    const merged = [];
    for (const a of mergedAll) {
      const k = String(a._id || a.id || (a.date + "_" + String(a.startTime || "")));
      if (!seen.has(k)) { seen.add(k); merged.push(a); }
    }
    const toTS = (a) => {
      const d = new Date(a.date);
      if (Number.isNaN(d.getTime())) return 0;
      const t = String(a.startTime || "00:00");
      const parts = t.split(":");
      const hh = Number(parts[0]) || 0;
      const mm = Number(parts[1]) || 0;
      d.setHours(hh, mm, 0, 0);
      return d.getTime();
    };
    const pending = merged.filter((a) => String(a.status).toUpperCase() === "PENDING");
    const confirmed = merged.filter((a) => String(a.status).toUpperCase() === "CONFIRMED");
    const done = merged.filter((a) => {
      const s = String(a.status).toUpperCase();
      return s === "CANCELLED" || s === "COMPLETED";
    });
    pending.sort((x, y) => toTS(y) - toTS(x));
    confirmed.sort((x, y) => toTS(y) - toTS(x));
    done.sort((x, y) => toTS(y) - toTS(x));
    const ordered = [...pending, ...confirmed, ...done];
    return ordered.slice(0, 4);
  }, [list, latestToday]);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
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
              <Link to="/doctor/today" className="block px-3 py-2 rounded-md hover:bg-slate-50">Appointments</Link>
              <Link to="/doctor/profile" className="block px-3 py-2 rounded-md hover:bg-slate-50">Profile</Link>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="fixed right-4 top-4 z-50 space-y-2">
            {notifs.map((n) => (
              <div key={n.id} className="flex items-center gap-2 bg-white shadow-lg border border-amber-200 rounded-lg px-3 py-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a7 7 0 00-7 7v3l-2 3h18l-2-3V9a7 7 0 00-7-7zm0 20a3 3 0 003-3H9a3 3 0 003 3z" fill="#F59E0B"/>
                </svg>
                <div className="text-sm text-slate-900">{n.text}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Doctor Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className={`inline-block text-xs px-2 py-1 rounded ${busy ? 'bg-amber-100 text-amber-700' : (online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>{busy ? 'Busy' : (online ? 'Online' : 'Offline')}</span>
              <div className="flex rounded-full border border-slate-300 overflow-hidden">
                <button onClick={() => setStatus('online')} className={`px-3 py-1 text-xs ${online && !busy ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}>Online</button>
                <button onClick={() => setStatus('offline')} className={`px-3 py-1 text-xs ${(!online && !busy) ? 'bg-red-600 text-white' : 'bg-white text-red-700'}`}>Offline</button>
                <button onClick={() => setStatus('busy')} className={`px-3 py-1 text-xs ${busy ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'}`}>Busy</button>
              </div>
              <button
                onClick={() => {
                  try {
                    const uid = localStorage.getItem("userId") || "";
                  if (uid) {
                    localStorage.setItem(`doctorOnlineById_${uid}`, "0");
                    localStorage.setItem(`doctorBusyById_${uid}`, "0");
                  }
                  } catch (_) {}
                  localStorage.removeItem("token");
                  nav("/doctor/login");
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-700 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 2a1 1 0 000 2h1v2h8V4h1a1 1 0 100-2H7zM5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2H5zm3 3h8v2H8v-2zm0 4h8v2H8v-2z" fill="#4B5563"/>
                </svg>
                <span>Upcoming Appointments</span>
              </div>
              {upcoming.length === 0 ? (
                <div className="text-slate-600">No upcoming appointments</div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((a) => (
                    <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <div>
                        <div className="font-semibold text-slate-900">{a.patient?.name || 'Patient'}</div>
                        <div className="text-xs text-slate-600">{a.date} • {a.startTime} • {a.type === 'online' ? 'Online' : 'Clinic'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
                        {String(a.status).toUpperCase() === 'PENDING' && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-700 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a7 7 0 00-7 7v3l-2 3h18l-2-3V9a7 7 0 00-7-7zm0 20a3 3 0 003-3H9a3 3 0 003 3z" fill="#16A34A"/>
                </svg>
                <span>Completed Consultations</span>
              </div>
              {completed.length === 0 ? (
                <div className="text-slate-600">No completed consultations</div>
              ) : (
                <div className="space-y-2">
                  {completed.map((a) => (
                    <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <div>
                        <div className="font-semibold text-slate-900">{a.patient?.name || 'Patient'}</div>
                        <div className="text-xs text-slate-600">{a.date} • {a.startTime} • {a.type === 'online' ? 'Online' : 'Clinic'}</div>
                      </div>
                      {a.prescriptionText ? (
                        <button onClick={() => window.open(`/prescription/${a._id || a.id}`, '_blank')} className="px-2 py-1 rounded-md border border-indigo-600 text-indigo-700 text-xs">Prescription</button>
                      ) : (
                        <span className="text-xs text-slate-600">No prescription</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z" fill="#06B6D4"/>
              </svg>
              <span>Hospital / Clinic Details</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-slate-700">Name: <span className="text-slate-900">{String(profile?.clinic?.name || '').trim() || '--'}</span></div>
              <div className="text-slate-700">City: <span className="text-slate-900">{String(profile?.clinic?.city || '').trim() || '--'}</span></div>
              <div className="text-slate-700">Address: <span className="text-slate-900">{String(profile?.clinic?.address || '').trim() || '--'}</span></div>
            </div>
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
                      {(() => {
                        const pid = String(a.patient?._id || a.patient || "");
                        let img = String(a.patient?.photoBase64 || localStorage.getItem(`userPhotoBase64ById_${pid}`) || "");
                        let src = img;
                        if (img && !img.startsWith("data:") && !img.startsWith("http")) {
                          src = `data:image/png;base64,${img}`;
                        }
                        const ok = src.startsWith("data:") || src.startsWith("http");
                        return ok ? (
                          <img src={src} alt="User" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full border bg-white" />
                        );
                      })()}
                      <div>
                        <div className="font-semibold text-slate-900">{a.patient?.name || "User"}</div>
                        <div className="text-xs text-slate-600">{(() => {
                          const p = a.patient || {};
                          if (p.age !== undefined && p.age !== null && p.age !== "") return `Age: ${p.age}`;
                          const pid = String(p._id || a.patient || "");
                          const locAge = localStorage.getItem(`userAgeById_${pid}`) || "";
                          if (locAge) return `Age: ${locAge}`;
                          const dob = p.birthday || p.dob || p.dateOfBirth || localStorage.getItem(`userDobById_${pid}`) || "";
                          if (!dob) return "";
                          const d = new Date(dob);
                          if (Number.isNaN(d.getTime())) return "";
                          const t = new Date();
                          let age = t.getFullYear() - d.getFullYear();
                          const m = t.getMonth() - d.getMonth();
                          if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
                          return `Age: ${age}`;
                        })()}</div>
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
                      (() => {
                        const s = String(a.status || "").toUpperCase();
                        return (
                          <span
                            className={`inline-block text-xs px-2 py-1 rounded ${s === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                          >
                            {s === "CANCELLED" ? "Cancelled" : s === "CONFIRMED" ? "Accepted" : "Completed"}
                          </span>
                        );
                      })()
                    )}
                    {canFollowUp(a) && (
                      <button
                        onClick={() => {
                          setFollowAppt(a);
                          const keyBase = `fu_${String(a._id || a.id)}`;
                          try {
                            const msgs = JSON.parse(localStorage.getItem(`${keyBase}_chat`) || '[]');
                            const files = JSON.parse(localStorage.getItem(`${keyBase}_files`) || '[]');
                            setFuChat(Array.isArray(msgs) ? msgs : []);
                            setFuFiles(Array.isArray(files) ? files : []);
                          } catch (_) { setFuChat([]); setFuFiles([]); }
                        }}
                        className="ml-2 px-2 py-1 rounded-md border border-green-600 text-green-700 text-xs"
                      >
                        Follow-up
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2a1 1 0 000 2h1v2h8V4h1a1 1 0 100-2H7zM5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2H5zm3 3h8v2H8v-2zm0 4h8v2H8v-2z" fill="#4B5563"/>
              </svg>
              <span>Today's Appointments</span>
            </div>
            {loading && <div className="text-slate-600">Loading...</div>}
            {error && !loading && <div className="text-red-600 mb-3 text-sm">{error}</div>}
            <div className="space-y-3">
              {(latestToday || []).length === 0 && !loading ? (
                <div className="text-slate-600">No appointments today</div>
              ) : (
                (latestToday || []).filter((a) => a.type === 'online').map((a) => (
                  <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-semibold text-slate-900">{a.patient?.name || 'Patient'}</div>
                      <div className="text-xs text-slate-600">Time: {a.startTime} • Type: {a.type === 'online' ? 'Online' : 'Clinic'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
                      {a.type === 'online' && String(a.status).toUpperCase() === 'CONFIRMED' && (
                        (() => {
                          const start = new Date(a.date);
                          const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
                          start.setHours(sh, sm, 0, 0);
                          const end = new Date(a.date);
                          const [eh, em] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
                          end.setHours(eh, em, 0, 0);
                          if (end.getTime() <= start.getTime()) end.setTime(start.getTime() + 30 * 60 * 1000);
                          const now = Date.now();
                          const windowStart = start.getTime() - 5 * 60 * 1000;
                          if (now >= end.getTime()) {
                            return (
                              <button
                                onClick={() => setExpiredAppt(a)}
                                className="px-3 py-1 rounded-md border border-red-600 text-red-700"
                              >
                                Time Expired
                              </button>
                            );
                          }
                          if (now < windowStart) {
                            return <span className="inline-block text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Available 5 min before</span>;
                          }
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const docId = String(a.doctor?._id || a.doctor || '');
                                  const isOnline = localStorage.getItem(`doctorOnlineById_${docId}`) === '1';
                                  if (!isOnline) { alert('You are offline. Set status to ONLINE to start consultation.'); return; }
                                  const id = String(a._id || a.id || '');
                                  const stored = id ? localStorage.getItem(`meetlink_${id}`) : '';
                                  let pick = (stored && /^https?:\/\//.test(stored)) ? stored : String(a.meetingLink || '');
                                  let url = String(pick).replace(/[`'\"]/g, '').trim();
                                  if (!url || !/^https?:\/\//.test(url)) {
                                    try {
                                      const resp = await API.post(`/appointments/${id}/meet-link/generate`);
                                      url = String(resp?.data?.url || '').trim();
                                      if (!/^https?:\/\//.test(url)) { alert('Failed to generate meeting link'); return; }
                                      try { localStorage.setItem(`meetlink_${id}`, url); } catch(_) {}
                                    } catch (e) {
                                      alert(e.response?.data?.message || e.message || 'Failed to generate meeting link');
                                      return;
                                    }
                                  } else {
                                    try { await API.put(`/appointments/${id}/meet-link`, { url }); } catch(_) {}
                                  }
                                  try {
                                    const chan = new BroadcastChannel('meetlink');
                                    chan.postMessage({ id, url });
                                    try { chan.close(); } catch(_) {}
                                  } catch (_) {}
                                  try {
                                    const key = `wr_${id}_chat`;
                                    const chat = JSON.parse(localStorage.getItem(key) || '[]');
                                    const next = Array.isArray(chat) ? [...chat, String(url)] : [String(url)];
                                    localStorage.setItem(key, JSON.stringify(next));
                                  } catch (_) {}
                                  try {
                                    const uid = localStorage.getItem('userId') || '';
                                    if (uid) {
                                      localStorage.setItem(`doctorBusyById_${uid}`, '1');
                                      API.put('/doctors/me/status', { isOnline: true, isBusy: true }).catch(() => {});
                                    }
                                  } catch(_) {}
                                  window.open(url, '_blank');
                                }}
                                className="px-3 py-1 rounded-md border border-green-600 text-green-700"
                              >
                                Join
                              </button>
                              <button
                                onClick={async () => {
                                  const id = String(a._id || a.id || '');
                                  let url = String(localStorage.getItem(`meetlink_${id}`) || a.meetingLink || '').replace(/[`'\"]/g, '').trim();
                                  if (!url || !/^https?:\/\//.test(url)) {
                                    try {
                                      const resp = await API.post(`/appointments/${id}/meet-link/generate`);
                                      url = String(resp?.data?.url || '').trim();
                                      if (!/^https?:\/\//.test(url)) { alert('Failed to generate meeting link'); return; }
                                    } catch (e) {
                                      alert(e.response?.data?.message || e.message || 'Failed to generate meeting link');
                                      return;
                                    }
                                  }
                                  try { localStorage.setItem(`meetlink_${id}`, url); } catch(_) {}
                                  try { await API.put(`/appointments/${id}/meet-link`, { url }); } catch(_) {}
                                  try { const chan = new BroadcastChannel('meetlink'); chan.postMessage({ id, url }); chan.close(); } catch(_) {}
                                  alert('Meeting link set');
                                }}
                                className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700"
                              >
                                Set Link
                              </button>
                            </div>
                          );
                        })()
                      )}
                      {canFollowUp(a) && (
                        <button
                          onClick={() => {
                            setFollowAppt(a);
                            const keyBase = `fu_${String(a._id || a.id)}`;
                            try {
                              const msgs = JSON.parse(localStorage.getItem(`${keyBase}_chat`) || '[]');
                              const files = JSON.parse(localStorage.getItem(`${keyBase}_files`) || '[]');
                              setFuChat(Array.isArray(msgs) ? msgs : []);
                              setFuFiles(Array.isArray(files) ? files : []);
                            } catch (_) { setFuChat([]); setFuFiles([]); }
                          }}
                          className="px-3 py-1 rounded-md border border-green-600 text-green-700"
                        >
                          Follow-up
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
      {followAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-[95vw] max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-900">Free Follow-up (5 days)</div>
              <button
                onClick={() => setFollowAppt(null)}
                className="px-3 py-1 rounded-md border border-slate-300"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="text-slate-700 text-sm">Patient: <span className="text-slate-900">{followAppt.patient?.name || ''}</span></div>
              <div className="mt-4">
                <div className="text-slate-900 font-semibold mb-1">Chat</div>
                <div className="h-28 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                  {fuChat.length === 0 ? (
                    <div className="text-slate-600 text-sm">No messages</div>
                  ) : (
                    fuChat.map((m, idx) => (
                      <div key={idx} className="text-sm text-slate-700">{m}</div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={fuText}
                    onChange={(e) => setFuText(e.target.value)}
                    placeholder="Reply to patient"
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (fuText.trim()) {
                        const next = [...fuChat, fuText.trim()];
                        setFuChat(next);
                        const keyBase = `fu_${String(followAppt._id || followAppt.id)}`;
                        try { localStorage.setItem(`${keyBase}_chat`, JSON.stringify(next)); } catch(_) {}
                        setFuText("");
                      }
                    }}
                    className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-4">
                  <div className="text-slate-900 font-semibold mb-1">Patient reports</div>
                  <div className="space-y-2">
                    {fuFiles.length === 0 ? (
                      <div className="text-slate-600 text-sm">No reports provided</div>
                    ) : (
                      fuFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                          <div className="text-sm text-slate-700 truncate">{f.name}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => window.open(f.url, '_blank')} className="px-2 py-1 rounded-md border border-slate-300 text-sm">Open</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-600">No video call in follow-up. For a new call, patient must book again.</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {expiredAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-[95vw] max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-900">Time Expired</div>
              <button
                onClick={() => setExpiredAppt(null)}
                className="px-3 py-1 rounded-md border border-slate-300"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="text-slate-700 text-sm">Appointment time has passed. Joining is disabled. Ask the patient to book again for a new call.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
