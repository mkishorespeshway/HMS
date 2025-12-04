import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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
  const [bellCount, setBellCount] = useState(0);
  const [chatAppt, setChatAppt] = useState(null);
  const [chatPreview, setChatPreview] = useState(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const socketRef = useRef(null);
  const meetWinRef = useRef(null);
  const meetMonitorRef = useRef(null);
  const [followAppt, setFollowAppt] = useState(null);
  const [fuChat, setFuChat] = useState([]);
  const [fuFiles, setFuFiles] = useState([]);
  const [fuText, setFuText] = useState("");
  const [profile, setProfile] = useState(null);
  const [expiredAppt, setExpiredAppt] = useState(null);
  const [muteUntil, setMuteUntil] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelItems, setPanelItems] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelUnread, setPanelUnread] = useState(0);

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

        const _d0 = new Date();
        const todayStr = `${_d0.getFullYear()}-${String(_d0.getMonth()+1).padStart(2,'0')}-${String(_d0.getDate()).padStart(2,'0')}`;
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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/notifications', { params: { unread: 1 } });
        const items = Array.isArray(data) ? data : [];
        const unread = items.filter((x) => !x.read).length;
        setBellCount(unread);
      } catch (_) {}
    })();
    try {
      const chan = new BroadcastChannel('chatmsg');
      const onMsg = (e) => {
        try {
          const { apptId, actor } = e.data || {};
          if (String(actor || '').toLowerCase() !== 'patient') return;
          const id = String(apptId || '');
          if (!id) return;
          setBellCount((c) => c + 1);
          try { localStorage.setItem('lastChatApptId', id); } catch(_) {}
          const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id);
          addNotif(`New message from ${a?.patient?.name || 'patient'}`, id);
        } catch (_) {}
      };
      chan.onmessage = onMsg;
      return () => { try { chan.close(); } catch(_) {} };
    } catch (_) {}
  }, [list, latestToday]);

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

  const openMeetFor = async (apptId) => {
    try {
      const id = String(apptId || '');
      if (!id) return;
      const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id) || null;
      if (!a) { nav('/doctor/appointments?joinMeet=' + encodeURIComponent(id)); return; }
      if (!online) { alert('You are offline. Set status to ONLINE to join consultation.'); return; }
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
      try { localStorage.setItem(`joinedByDoctor_${id}`, '1'); } catch(_) {}
      try { socketRef.current && socketRef.current.emit('meet:update', { apptId: id, actor: 'doctor', event: 'join' }); } catch(_) {}
      try {
        const uid = localStorage.getItem('userId') || '';
        if (uid) {
          localStorage.setItem(`doctorBusyById_${uid}`, '1');
          API.put('/doctors/me/status', { isOnline: true, isBusy: true }).catch(() => {});
        }
      } catch(_) {}
      setOnline(true);
      setBusy(true);
      try {
        meetWinRef.current = window.open(url, '_blank');
        meetMonitorRef.current = setInterval(() => {
          if (!meetWinRef.current || meetWinRef.current.closed) {
            if (meetMonitorRef.current) { clearInterval(meetMonitorRef.current); meetMonitorRef.current = null; }
            try { localStorage.removeItem(`joinedByDoctor_${id}`); } catch(_) {}
            try {
              const uid = localStorage.getItem('userId') || '';
              if (uid) {
                localStorage.setItem(`doctorBusyById_${uid}`, '0');
                API.put('/doctors/me/status', { isOnline: true, isBusy: false }).catch(() => {});
              }
            } catch(_) {}
            setBusy(false);
          }
        }, 1000);
      } catch(_) {}
    } catch(_) {}
  };
  const leaveMeetFor = (apptId) => {
    try {
      const id = String(apptId || '');
      if (!id) return;
      try { localStorage.setItem(`leftDoctor_${id}`, '1'); } catch(_) {}
      try { localStorage.removeItem(`joinedByDoctor_${id}`); } catch(_) {}
      try {
        const uid = localStorage.getItem('userId') || '';
        if (uid) {
          localStorage.setItem(`doctorBusyById_${uid}`, '0');
          API.put('/doctors/me/status', { isOnline: true, isBusy: false }).catch(() => {});
        }
      } catch(_) {}
      setBusy(false);
      setOnline(true);
      try { socketRef.current && socketRef.current.emit('meet:update', { apptId: id, actor: 'doctor', event: 'exit' }); } catch(_) {}
      try {
        if (meetMonitorRef.current) { clearInterval(meetMonitorRef.current); meetMonitorRef.current = null; }
        if (meetWinRef.current && !meetWinRef.current.closed) { meetWinRef.current.close(); }
        meetWinRef.current = null;
      } catch(_) {}
    } catch(_) {}
  };

  const addNotif = (text, apptId, link) => {
    const id = String(Date.now()) + String(Math.random());
    setNotifs((prev) => [{ id, text, apptId, link }, ...prev].slice(0, 4));
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
            socketRef.current = socket;
            socket.on("appointment:new", (a) => {
              try {
                const did = String(a?.doctor?._id || a?.doctor || "");
                if (did !== String(uid)) return;
                const key = String(a._id || a.id || "");
                const seen = new Set([...(list || []), ...(latestToday || [])].map((x) => String(x._id || x.id || "")));
                if (seen.has(key)) return;
                addNotif(`New appointment booked at ${a.startTime || "--:--"}`, null, "/doctor/dashboard#all-appointments");
                setLatestToday((prev) => [a, ...prev]);
                setList((prev) => [a, ...prev]);
              } catch (_) {}
            });
            socket.on('meet:update', (msg) => {
              try {
                const { apptId, actor, event } = msg || {};
                const id = String(apptId || '');
                if (!id) return;
                const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id);
                if (!a) return;
                const start = new Date(a.date);
                const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
                start.setHours(sh, sm, 0, 0);
                const end = new Date(a.date);
                const [eh, em] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
                end.setHours(eh, em, 0, 0);
                const now = Date.now();
                const active = now >= start.getTime() && now < end.getTime();
                if (event === 'join' && actor === 'patient') {
                  try { localStorage.setItem(`joinedByPatient_${id}`, '1'); } catch(_) {}
                  setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: active ? 'JOINED' : x.status } : x)));
                } else if (event === 'exit' && actor === 'patient') {
                  try { localStorage.removeItem(`joinedByPatient_${id}`); } catch(_) {}
                  if (active) setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: 'CONFIRMED' } : x)));
                } else if (event === 'join' && actor === 'doctor') {
                  try { localStorage.setItem(`joinedByDoctor_${id}`, '1'); } catch(_) {}
                  setBusy(true);
                  setOnline(true);
                } else if (event === 'exit' && actor === 'doctor') {
                  try { localStorage.removeItem(`joinedByDoctor_${id}`); } catch(_) {}
                  if (active) {
                    try { localStorage.setItem(`leftDoctor_${id}`, '1'); } catch(_) {}
                  } else {
                    try { localStorage.removeItem(`leftDoctor_${id}`); } catch(_) {}
                  }
                  setBusy(false);
                  setOnline(true);
                } else if (event === 'complete') {
                  setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: 'COMPLETED' } : x)));
                  try {
                    const uidLoc = localStorage.getItem('userId') || '';
                    if (uidLoc) localStorage.setItem(`doctorBusyById_${uidLoc}`, '0');
                  } catch(_) {}
                  setBusy(false);
                  setOnline(true);
                }
              } catch (_) {}
            });
            socket.on('meet:update', (msg) => {
              try {
                const { apptId, actor, event } = msg || {};
                const id = String(apptId || '');
                if (!id) return;
                const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id);
                if (!a) return;
                const start = new Date(a.date);
                const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
                start.setHours(sh, sm, 0, 0);
                const end = new Date(a.date);
                const [eh, em] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
                end.setHours(eh, em, 0, 0);
                const now = Date.now();
                const active = now >= start.getTime() && now < end.getTime();
                if (event === 'join' && actor === 'patient') {
                  try { localStorage.setItem(`joinedByPatient_${id}`, '1'); } catch(_) {}
                  setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: active ? 'JOINED' : x.status } : x)));
                } else if (event === 'exit' && actor === 'patient') {
                  try { localStorage.removeItem(`joinedByPatient_${id}`); } catch(_) {}
                  if (active) setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: 'CONFIRMED' } : x)));
                 } else if (event === 'join' && actor === 'doctor') {
                   try { localStorage.setItem(`joinedByDoctor_${id}`, '1'); } catch(_) {}
                   setBusy(true);
                   setOnline(true);
                 } else if (event === 'exit' && actor === 'doctor') {
                   try { localStorage.removeItem(`joinedByDoctor_${id}`); } catch(_) {}
                   setBusy(false);
                   setOnline(true);
                } else if (event === 'complete') {
                  setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, status: 'COMPLETED' } : x)));
                  try {
                    const uidLoc = localStorage.getItem('userId') || '';
                    if (uidLoc) localStorage.setItem(`doctorBusyById_${uidLoc}`, '0');
                  } catch(_) {}
                  setBusy(false);
                  setOnline(true);
                }
              } catch (_) {}
            });
            socket.on('chat:new', (msg) => {
              try {
                const { apptId, actor } = msg || {};
                if (String(actor || '').toLowerCase() !== 'patient') return;
                const id = String(apptId || '');
                if (!id) return;
                setBellCount((c) => c + 1);
                try { localStorage.setItem('lastChatApptId', id); } catch(_) {}
                const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id);
                addNotif(`New message from ${a?.patient?.name || 'patient'}`, id);
              } catch (_) {}
            });
            socket.on('notify', (p) => {
              try {
                if (Date.now() < muteUntil) return;
                const text = p?.message || '';
                const link = p?.link || '';
                const apptId = p?.apptId ? String(p.apptId) : null;
                if (p?.type === 'chat' && apptId) try { localStorage.setItem('lastChatApptId', apptId); } catch(_) {}
                setBellCount((c) => c + 1);
                addNotif(text, apptId, link);
                if (panelOpen) {
                  const item = { _id: p?.id || String(Date.now()), id: p?.id || String(Date.now()), message: text, link, type: p?.type || 'general', createdAt: new Date().toISOString(), read: false, apptId };
                  setPanelItems((prev) => {
                    const exists = prev.some((x) => String(x._id || x.id) === String(item._id || item.id));
                    if (exists) return prev;
                    return [item, ...prev].slice(0, 100);
                  });
                  setPanelUnread((c) => c + 1);
                }
              } catch (_) {}
            });
            cleanup.push(() => { try { socket.close(); } catch(_) {} });
          }
        } catch(_) {}
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
            addNotif(`New appointment booked at ${a.startTime || "--:--"}`, null, "/doctor/dashboard#all-appointments");
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
      const _d1 = new Date();
      const todayStr = `${_d1.getFullYear()}-${String(_d1.getMonth()+1).padStart(2,'0')}-${String(_d1.getDate()).padStart(2,'0')}`;
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
      const _d2 = new Date();
      const todayStr = `${_d2.getFullYear()}-${String(_d2.getMonth()+1).padStart(2,'0')}-${String(_d2.getDate()).padStart(2,'0')}`;
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
      if (!(s === "PENDING" || s === "CONFIRMED")) return false;
      const ts = apptStartTs(a);
      return ts > now;
    });
    arr.sort((x, y) => apptStartTs(x) - apptStartTs(y));
    return arr.slice(0, 6);
  }, [list]);

  useEffect(() => {
    const t = setInterval(() => {
      const _d3 = new Date();
      const todayStr = `${_d3.getFullYear()}-${String(_d3.getMonth()+1).padStart(2,'0')}-${String(_d3.getDate()).padStart(2,'0')}`;
      const src = [...(list || []), ...(latestToday || [])];
      const targetMs = 5 * 60 * 1000;
      const windowMs = 60 * 1000;
      const now = Date.now();
      src.forEach((a) => {
        try {
          const id = String(a._id || a.id || '');
          const key = `warn5m_${id}`;
          if (!id) return;
          if (localStorage.getItem(key) === '1') return;
          if (String(a.type).toLowerCase() !== 'online') return;
          const s = String(a.status || '').toUpperCase();
          if (s === 'CANCELLED' || s === 'COMPLETED') return;
          if (String(a.date || '') !== todayStr) return;
          const startTs = apptStartTs(a);
          if (!startTs) return;
          const diff = startTs - now;
          if (diff <= targetMs && diff > targetMs - windowMs) {
            alert('Your meeting will start in 5 minutes.');
            try { localStorage.setItem(key, '1'); } catch(_) {}
          }
        } catch (_) {}
      });
    }, 30000);
    return () => clearInterval(t);
  }, [list, latestToday]);

  const completed = useMemo(() => {
    const arr = (list || []).filter((a) => String(a.status).toUpperCase() === "COMPLETED");
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/doctor/dashboard" className="flex items-center gap-4 group hover:scale-105 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-white/20">
              <div className="text-white">
                <Logo size={20} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                HospoZen
              </span>
              
            </div>
          </Link>
          <nav className="flex items-center gap-6 ml-6 text-slate-700">
            <Link to="/doctor/dashboard" className="nav-link text-indigo-700 font-semibold">Dashboard</Link>
            <Link to="/doctor/appointments" className="nav-link">Appointments</Link>
            <Link to="/doctor/profile" className="nav-link">Profile</Link>
          </nav>
        </div>
        <div className="relative flex items-center gap-3">
          <span className={`inline-block text-xs px-2 py-1 rounded ${busy ? 'bg-amber-100 text-amber-700' : (online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>{busy ? 'Busy' : (online ? 'Online' : 'Offline')}</span>
          <div className="flex rounded-full border border-slate-300 overflow-hidden">
            <button onClick={() => setStatus('online')} className={`px-3 py-1 text-xs ${online && !busy ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}>Online</button>
            <button onClick={() => setStatus('offline')} className={`px-3 py-1 text-xs ${(!online && !busy) ? 'bg-red-600 text-white' : 'bg-white text-red-700'}`}>Offline</button>
            <button onClick={() => setStatus('busy')} className={`px-3 py-1 text-xs ${busy ? 'bg-amber-500 text-white' : 'bg-white text-amber-700'}`}>Busy</button>
          </div>
          <button
            onClick={async () => {
              try {
                setPanelOpen((v) => !v);
                if (!panelOpen) {
                  setPanelLoading(true);
                  const { data } = await API.get('/notifications');
                  const items = Array.isArray(data) ? data : [];
                  setPanelItems(items);
                  const unread = items.filter((x) => !x.read).length;
                  setPanelUnread(unread);
                  setBellCount(unread);
                  setPanelLoading(false);
                }
              } catch (_) { setPanelLoading(false); }
            }}
            className="relative h-9 w-9 rounded-full border border-slate-300 flex items-center justify-center"
            title="Notifications"
          >
            <span role="img" aria-label="bell">🔔</span>
            {bellCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{bellCount}</span>
            )}
          </button>
            {panelOpen && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
              <div className="bg-indigo-700 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
                <div className="font-semibold">Your Notifications</div>
                <div className="text-xs bg-green-500 text-white rounded-full px-2 py-0.5">{panelUnread} New</div>
              </div>
              <div className="px-4 py-2 flex items-center justify-between border-b">
                <button onClick={() => nav('/doctor/dashboard')} className="text-indigo-700 text-sm">View All</button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      try { await API.delete('/notifications'); setPanelItems([]); setPanelUnread(0); setBellCount(0); } catch(_) {}
                    }}
                    className="text-white bg-indigo-700 rounded-md px-2 py-1 text-xs"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {panelLoading ? (
                  <div className="p-4 text-sm text-slate-600">Loading…</div>
                ) : panelItems.length === 0 ? (
                  <div className="p-4 text-sm text-slate-600">No notifications</div>
                ) : (
                  panelItems.map((n) => (
                    <div key={n._id || n.id} className="px-4 py-3 border-b hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <button
                          onClick={async () => {
                            try {
                              if (n.type === 'chat') {
                                const id = String(n.apptId || '');
                                if (id) {
                                  try { localStorage.setItem('lastChatApptId', id); } catch(_) {}
                                  const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id) || null;
                                  setChatAppt(a || { _id: id, id, patient: { name: '' } });
                                }
                              } else if (n.type === 'meet' && n.apptId) {
                                await openMeetFor(n.apptId);
                              } else if (n.type === 'appointment') {
                                nav('/doctor/appointments');
                              } else if (n.link) {
                                nav(n.link);
                              }
                              setPanelOpen(false);
                              try { await API.put(`/notifications/${n._id || n.id}/read`); } catch(_) {}
                              setPanelItems((prev) => prev.map((x) => (String(x._id || x.id) === String(n._id || n.id) ? { ...x, read: true } : x)));
                              setPanelUnread((c) => Math.max(0, c - 1));
                              setBellCount((c) => Math.max(0, c - 1));
                            } catch(_) {}
                          }}
                          className="text-left text-sm text-slate-900"
                        >
                          {n.message}
                        </button>
                        {!n.read && (
                          <button onClick={async () => { try { await API.put(`/notifications/${n._id || n.id}/read`); setPanelItems((prev) => prev.map((x) => (String(x._id || x.id) === String(n._id || n.id) ? { ...x, read: true } : x))); setPanelUnread((c) => Math.max(0, c - 1)); } catch(_) {} }} className="text-xs text-slate-600">Mark As Read</button>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}
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
      <div className="grid grid-cols-12 gap-6">
        <main className="col-span-12">
          <div className="fixed right-4 top-4 z-50 space-y-2">
            {notifs.map((n) => (
              <button key={n.id} onClick={async () => {
                try {
                  if (n.type === 'chat' && n.apptId) {
                    const id = String(n.apptId);
                    try { localStorage.setItem('lastChatApptId', id); } catch(_) {}
                    const a = (list || []).find((x) => String(x._id || x.id) === id) || (latestToday || []).find((x) => String(x._id || x.id) === id) || null;
                    setChatAppt(a || { _id: id, id, patient: { name: '' } });
                  } else if (n.type === 'meet' && n.apptId) {
                    await openMeetFor(n.apptId);
                  } else if (n.link) {
                    nav(n.link);
                  } else if (n.type === 'meet' || n.type === 'appointment') {
                    nav('/doctor/appointments');
                  } else if (n.apptId) {
                    nav('/doctor/dashboard#all-appointments');
                  }
                  setNotifs((prev) => prev.filter((x) => x.id !== n.id));
                } catch (_) {}
              }} className="flex items-center gap-2 bg-white shadow-lg border border-amber-200 rounded-lg px-3 py-2 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a7 7 0 00-7 7v3l-2 3h18l-2-3V9a7 7 0 00-7-7zm0 20a3 3 0 003-3H9a3 3 0 003 3z" fill="#F59E0B"/>
                </svg>
                <div className="text-sm text-slate-900">{n.text}</div>
              </button>
            ))}
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-semibold">Doctor Dashboard</h1>
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
                        {String(a.status).toUpperCase() !== 'CANCELLED' && (
                          <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
                        )}
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
                      <div className="flex items-center gap-2">
                        {a.prescriptionText ? (
                          <button onClick={() => nav(`/prescription/${a._id || a.id}`)} className="px-2 py-1 rounded-md border border-indigo-600 text-indigo-700 text-xs">Prescription</button>
                        ) : (
                          <span className="text-xs text-slate-600">No prescription</span>
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
                            className="px-2 py-1 rounded-md border border-green-600 text-green-700 text-xs"
                          >
                            Follow-up
                          </button>
                        )}
                      </div>
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

          <div id="all-appointments" className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-slate-700 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 2a1 1 0 000 2h1v2h8V4h1a1 1 0 100-2H7zM5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2H5zm3 3h8v2H8v-2zm0 4h8v2H8v-2z" fill="#4B5563"/>
              </svg>
              <span>All Appointments</span>
            </div>
            {loading && <div className="text-slate-600">Loading...</div>}
            {error && !loading && <div className="text-red-600 mb-3 text-sm">{error}</div>}
            <div className="space-y-2">
              {(list || []).length === 0 && !loading ? (
                <div className="text-slate-600">No appointments</div>
              ) : (
                (list || []).slice().sort((x, y) => apptStartTs(y) - apptStartTs(x)).map((a) => (
                  <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-semibold text-slate-900">{a.patient?.name || 'Patient'}</div>
                      <div className="text-xs text-slate-600">{a.date} • {a.startTime} • {a.type === 'online' ? 'Online' : 'Clinic'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const s = String(a.status).toUpperCase();
                        const cls = s === 'PENDING' ? 'bg-amber-100 text-amber-700' : s === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700' : s === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                        const txt = s === 'PENDING' ? 'Pending' : s === 'CONFIRMED' ? 'Confirmed' : s === 'COMPLETED' ? 'Completed' : 'Cancelled';
                        return <span className={`inline-block text-xs px-2 py-1 rounded ${cls}`}>{txt}</span>;
                      })()}
                      {(() => {
                        const s = String(a.status).toUpperCase();
                        const showPay = s !== 'CANCELLED' && s !== 'COMPLETED';
                        return showPay ? (
                          <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ))
              )}
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
                (latestToday || []).map((a) => (
                  <div key={a._id} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-semibold text-slate-900">{a.patient?.name || 'Patient'}</div>
                      <div className="text-xs text-slate-600">Time: {a.startTime} • Type: {a.type === 'online' ? 'Online' : 'Clinic'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const s = String(a.status).toUpperCase();
                        const showPay = s !== 'CANCELLED' && s !== 'COMPLETED';
                        return showPay ? (
                          <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
                        ) : null;
                      })()}
                      {null}
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
                            try { localStorage.removeItem(`leftDoctor_${String(a._id || a.id)}`); } catch(_) {}
                            return (
                              <span className="inline-block text-xs px-2 py-1 rounded bg-red-100 text-red-700">Time Expired</span>
                            );
                          }
                          if (now < windowStart) {
                            return <span className="inline-block text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Available 5 min before</span>;
                          }
                          const id = String(a._id || a.id || '');
                          const joinedDoc = id ? localStorage.getItem(`joinedByDoctor_${id}`) === '1' : false;
                          const leftDoc = id ? localStorage.getItem(`leftDoctor_${id}`) === '1' : false;
                          if (joinedDoc) {
                            return (
                              <div className="flex items-center gap-2">
                                <span className="inline-block text-xs px-2 py-1 rounded bg-green-100 text-green-700">Joined</span>
                                <button
                                  onClick={() => leaveMeetFor(id)}
                                  className="px-3 py-1 rounded-md border border-red-600 text-red-700"
                                >
                                  Leave
                                </button>
                              </div>
                            );
                          }
                          if (leftDoc) {
                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openMeetFor(id)}
                                  className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700"
                                >
                                  Rejoin
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openMeetFor(id)}
                                className="px-3 py-1 rounded-md border border-green-600 text-green-700"
                              >
                                Join
                              </button>
                              <button
                                onClick={async () => {
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
                            <button
                              onClick={() => {
                                try {
                                  const s = String(f.url || '');
                                  if (s.startsWith('data:')) {
                                    const m = s.match(/^data:(.*?);base64,(.*)$/);
                                    const mime = (m && m[1]) || 'application/octet-stream';
                                    const b64 = (m && m[2]) || '';
                                    const byteChars = atob(b64);
                                    const byteNumbers = new Array(byteChars.length);
                                    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: mime });
                                    const obj = URL.createObjectURL(blob);
                                    window.open(obj, '_blank');
                                    setTimeout(() => { try { URL.revokeObjectURL(obj); } catch(_) {} }, 15000);
                                  } else {
                                    window.open(s, '_blank');
                                  }
                                } catch(_) {}
                              }}
                              className="px-2 py-1 rounded-md border border-slate-300 text-sm"
                            >
                              Open
                            </button>
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
      {chatAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-[95vw] max-w-lg h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-900">Patient Details</div>
              <button onClick={() => { setChatAppt(null); setChatPreview(null); setIsFullPreview(false); }} className="px-3 py-1 rounded-md border border-slate-300">Close</button>
            </div>
            <div className="p-4 grid gap-3 overflow-y-auto flex-1">
              <div className="text-slate-700 text-sm">Patient: <span className="text-slate-900">{chatAppt.patient?.name || ''}</span></div>
              <div>
                <div className="text-slate-900 font-semibold mb-2">Pre-call chat</div>
                <div className="h-28 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                  {(() => {
                    try {
                      const id = String(chatAppt._id || chatAppt.id);
                      const msgs = JSON.parse(localStorage.getItem(`wr_${id}_chat`) || '[]');
                      if (!Array.isArray(msgs) || msgs.length === 0) return <div className="text-slate-600 text-sm">No messages</div>;
                      return msgs.map((m, idx) => (<div key={idx} className="text-sm text-slate-700">{m}</div>));
                    } catch(_) { return <div className="text-slate-600 text-sm">No messages</div>; }
                  })()}
                </div>
                <div className="mt-3">
                  <div className="text-slate-900 font-semibold mb-1">Medical reports uploaded</div>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const id = String(chatAppt._id || chatAppt.id);
                        const files = JSON.parse(localStorage.getItem(`wr_${id}_files`) || '[]');
                        const arr = (Array.isArray(files) ? files : []).filter((x) => typeof x?.url === 'string' && String(x.url).trim() !== '');
                        if (arr.length === 0) return <div className="text-slate-600 text-sm">No reports uploaded</div>;
                        return arr.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                            <div className="text-sm text-slate-700 truncate max-w-[12rem]">{f.name}</div>
                            <button onClick={() => { setChatPreview(f); setIsFullPreview(true); }} className="px-2 py-1 rounded-md border border-slate-300 text-sm">Open</button>
                          </div>
                        ));
                      } catch(_) { return <div className="text-slate-600 text-sm">No reports uploaded</div>; }
                    })()}
                  </div>
                  {chatPreview && !isFullPreview && (
                    <div className="mt-3 border rounded-md p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-slate-900 truncate">{chatPreview.name || 'Selected report'}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setIsFullPreview(true)} className="px-2 py-1 rounded-md border border-slate-300 text-xs">Full Screen</button>
                          <button onClick={() => setChatPreview(null)} className="px-2 py-1 rounded-md border border-slate-300 text-xs">Close Preview</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <img src={String(chatPreview.url || '')} alt="" className="max-h-64 w-auto object-contain cursor-zoom-in" onClick={() => setIsFullPreview(true)} />
                      </div>
                    </div>
                  )}
                  {chatPreview && isFullPreview && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setIsFullPreview(false)}
                        className="absolute top-4 right-4 px-3 py-1 rounded-md border border-slate-300 bg-white/90"
                      >Close</button>
                      <img
                        src={String(chatPreview.url || '')}
                        alt=""
                        className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain shadow-2xl"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input id="chatInputDoc" placeholder="Reply to patient" className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  <button
                    onClick={() => {
                      try {
                        const id = String(chatAppt._id || chatAppt.id);
                        const input = document.getElementById('chatInputDoc');
                        const val = String(input?.value || '').trim();
                        if (!val) return;
                        const msgs = JSON.parse(localStorage.getItem(`wr_${id}_chat`) || '[]');
                        const next = [...(Array.isArray(msgs) ? msgs : []), val];
                        localStorage.setItem(`wr_${id}_chat`, JSON.stringify(next));
                        if (input) input.value = '';
                        try {
                          const chan = new BroadcastChannel('chatmsg');
                          chan.postMessage({ apptId: id, actor: 'doctor' });
                          chan.close();
                        } catch(_) {}
                        try { socketRef.current && socketRef.current.emit('chat:new', { apptId: id, actor: 'doctor', kind: 'pre' }); } catch(_) {}
                        try { localStorage.setItem('lastChatApptId', id); } catch(_) {}
                      } catch(_) {}
                    }}
                    className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Send
                  </button>
                </div>
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
