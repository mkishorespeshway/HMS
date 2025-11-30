import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Logo from "../components/Logo";

export default function DoctorToday() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consult, setConsult] = useState(null);
  const meetChanRef = useRef(null);
  const [prescription, setPrescription] = useState("");
  const [rxMedicines, setRxMedicines] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxDuration, setRxDuration] = useState("");
  const [rxTests, setRxTests] = useState("");
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxAdvice, setRxAdvice] = useState("");
  const [chat, setChat] = useState([]);
  const [chatText, setChatText] = useState("");
  const jitsiRef = useRef(null);
  const apiRef = useRef(null);
  const [api, setApi] = useState(null);
  const [followAppt, setFollowAppt] = useState(null);
  const [fuChat, setFuChat] = useState([]);
  const [fuText, setFuText] = useState("");
  const [fuFiles, setFuFiles] = useState([]);
  const [detailsAppt, setDetailsAppt] = useState(null);
  const [wrChat, setWrChat] = useState([]);
  const [wrText, setWrText] = useState("");
  const [wrSymptoms, setWrSymptoms] = useState("");
  const [wrFiles, setWrFiles] = useState([]);
  const [joinMode, setJoinMode] = useState("video");
  const [consSymptoms, setConsSymptoms] = useState("");
  const [consFiles, setConsFiles] = useState([]);
  const [consHistory, setConsHistory] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      let items = [];
      try {
        const mine = await API.get("/appointments/mine");
        items = mine.data || [];
      } catch (eMine) {
        try {
          const uid = localStorage.getItem("userId");
          const admin = await API.get("/admin/appointments");
          const all = admin.data || [];
          items = all.filter((a) => String(a.doctor?._id || a.doctor) === String(uid));
        } catch (_) {}
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
      const pending = (items || []).filter((a) => String(a.status).toUpperCase() === "PENDING");
      const confirmed = (items || []).filter((a) => String(a.status).toUpperCase() === "CONFIRMED");
      const done = (items || []).filter((a) => {
        const s = String(a.status).toUpperCase();
        return s === "CANCELLED" || s === "COMPLETED";
      });
      pending.sort((x, y) => toTS(y) - toTS(x));
      confirmed.sort((x, y) => toTS(y) - toTS(x));
      done.sort((x, y) => toTS(y) - toTS(x));
      items = [...pending, ...confirmed, ...done];
      setList(items);
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    try { meetChanRef.current = new BroadcastChannel('meetlink'); } catch(_) {}
    return () => { try { meetChanRef.current && meetChanRef.current.close(); } catch(_) {} };
  }, []);

  useEffect(() => {
    const mount = async () => {
      if (!consult || !consult.meetingLink) return;
      if (joinMode === "chat") return;
      return;
      const container = jitsiRef.current;
      if (!container) return;
      const has = typeof window !== "undefined" && window.JitsiMeetExternalAPI;
      const init = () => {
        try {
          const url = new URL(String(consult.meetingLink));
          const room = url.pathname.replace(/^\//, "");
          const domain = url.hostname || "meet.jit.si";
          const instance = new window.JitsiMeetExternalAPI(domain, {
            roomName: room,
            parentNode: container,
            width: "100%",
            height: 420,
            userInfo: { displayName: "Doctor" },
            configOverwrite: { disableDeepLinking: true, startWithVideoMuted: joinMode === "audio", startWithAudioMuted: false },
            interfaceConfigOverwrite: { DEFAULT_REMOTE_DISPLAY_NAME: "Guest" }
          });
          apiRef.current = instance;
          setApi(instance);
        } catch (e) {}
      };
      if (!has) {
        const s = document.createElement("script");
        s.src = "https://meet.jit.si/external_api.js";
        s.onload = init;
        document.body.appendChild(s);
      } else {
        init();
      }
    };
    mount();
    return () => {
      try {
        if (apiRef.current) apiRef.current.dispose();
      } catch (_) {}
      apiRef.current = null;
      setApi(null);
    };
  }, [consult]);

  useEffect(() => {
    if (!consult) return;
    try {
      const id = String(consult._id || consult.id);
      const ws = String(localStorage.getItem(`wr_${id}_symptoms`) || "");
      const fs = String(localStorage.getItem(`fu_${id}_symptoms`) || "");
      setConsSymptoms(ws || fs || "");
      const wrF = JSON.parse(localStorage.getItem(`wr_${id}_files`) || "[]");
      const fuF = JSON.parse(localStorage.getItem(`fu_${id}_files`) || "[]");
      let files = ([]).concat(Array.isArray(wrF) ? wrF : [], Array.isArray(fuF) ? fuF : []);
      files = (Array.isArray(files) ? files : []).filter((x) => {
        const name = String(x?.name || '').toLowerCase();
        const by = String(x?.by || '').toLowerCase();
        if (by === 'doctor') return false;
        if (name.includes('prescription')) return false;
        return true;
      });
      if (!files.length) {
        try {
          const pid = String(consult.patient?._id || consult.patient || "");
          const ids = (list || []).filter((x) => String(x.patient?._id || x.patient || "") === pid).map((x) => String(x._id || x.id));
          const merged = [];
          for (const aid of ids) {
            try {
              const aWr = JSON.parse(localStorage.getItem(`wr_${aid}_files`) || "[]");
              const aFu = JSON.parse(localStorage.getItem(`fu_${aid}_files`) || "[]");
              const candidates = [...(Array.isArray(aWr) ? aWr : []), ...(Array.isArray(aFu) ? aFu : [])];
              for (const c of candidates) { if (c) merged.push(c); }
            } catch (_) {}
          }
          files = merged.filter((x) => {
            const name = String(x?.name || '').toLowerCase();
            const by = String(x?.by || '').toLowerCase();
            if (by === 'doctor') return false;
            if (name.includes('prescription')) return false;
            return true;
          });
        } catch (_) {}
      }
      setConsFiles(files);
    } catch (_) {
      setConsSymptoms("");
      setConsFiles([]);
    }
    try {
      setConsHistory([]);
    } catch (_) { setConsHistory([]); }
  }, [consult, list]);

  useEffect(() => {
    if (!detailsAppt) return;
    try {
      const id = String(detailsAppt._id || detailsAppt.id || "");
      const need = !detailsAppt.patientSymptoms && !detailsAppt.patientSummary;
      if (id && need) {
        API.get(`/appointments/${id}`).then((res) => {
          const data = res?.data || {};
          setDetailsAppt((prev) => (prev ? ({ ...(prev || {}), ...(data || {}) }) : prev));
        }).catch(() => {});
      }
    } catch (_) {}
    try {
      const id = String(detailsAppt._id || detailsAppt.id);
      const wrMsgs = JSON.parse(localStorage.getItem(`wr_${id}_chat`) || "[]");
      const wrS = String(detailsAppt.patientSymptoms || localStorage.getItem(`wr_${id}_symptoms`) || "");
      const wrF = JSON.parse(localStorage.getItem(`wr_${id}_files`) || "[]");
      const fuF = JSON.parse(localStorage.getItem(`fu_${id}_files`) || "[]");
      const fuS = String(detailsAppt.patientSummary || localStorage.getItem(`fu_${id}_symptoms`) || "");
      let msgs = Array.isArray(wrMsgs) ? wrMsgs : [];
      if (!msgs || msgs.length === 0) {
        try {
          const pid = String(detailsAppt.patient?._id || detailsAppt.patient || "");
          const ids = (list || []).filter((x) => String(x.patient?._id || x.patient || "") === pid).map((x) => String(x._id || x.id));
          const merged = [];
          for (const aid of ids) {
            try {
              const aWr = JSON.parse(localStorage.getItem(`wr_${aid}_chat`) || "[]");
              const aFu = JSON.parse(localStorage.getItem(`fu_${aid}_chat`) || "[]");
              const candidates = [...(Array.isArray(aWr) ? aWr : []), ...(Array.isArray(aFu) ? aFu : [])];
              for (const c of candidates) { if (c) merged.push(c); }
            } catch (_) {}
          }
          if (merged.length) msgs = merged;
        } catch (_) {}
      }
      let files = ([]).concat(Array.isArray(wrF) ? wrF : [], Array.isArray(fuF) ? fuF : []);
      files = (Array.isArray(files) ? files : []).filter((x) => {
        const name = String(x?.name || '').toLowerCase();
        const by = String(x?.by || '').toLowerCase();
        if (by === 'doctor') return false;
        if (name.includes('prescription')) return false;
        return true;
      });
      if (!files.length) {
        try {
          const pid = String(detailsAppt.patient?._id || detailsAppt.patient || "");
          const ids = (list || []).filter((x) => String(x.patient?._id || x.patient || "") === pid).map((x) => String(x._id || x.id));
          const merged = [];
          for (const aid of ids) {
            try {
              const aWr = JSON.parse(localStorage.getItem(`wr_${aid}_files`) || "[]");
              const aFu = JSON.parse(localStorage.getItem(`fu_${aid}_files`) || "[]");
              const candidates = [...(Array.isArray(aWr) ? aWr : []), ...(Array.isArray(aFu) ? aFu : [])];
              for (const c of candidates) { if (c) merged.push(c); }
            } catch (_) {}
          }
          files = merged.filter((x) => {
            const name = String(x?.name || '').toLowerCase();
            const by = String(x?.by || '').toLowerCase();
            if (by === 'doctor') return false;
            if (name.includes('prescription')) return false;
            return true;
          });
        } catch (_) {}
      }
      const normMsgs = (Array.isArray(msgs) ? msgs : []).map((it) => (typeof it === 'string' ? it : String(it?.text || ''))).filter(Boolean);
      setWrChat(normMsgs);
      setWrFiles(files);
      let symptoms = String(wrS || fuS || "");
      if (!symptoms) {
        try {
          const pid = String(detailsAppt.patient?._id || detailsAppt.patient || "");
          const ids = (list || []).filter((x) => String(x.patient?._id || x.patient || "") === pid).map((x) => String(x._id || x.id));
          for (const aid of ids) {
            try {
              const s1 = String(localStorage.getItem(`wr_${aid}_symptoms`) || "");
              const s2 = String(localStorage.getItem(`fu_${aid}_symptoms`) || "");
              if (s2) { symptoms = s2; } else if (s1) { symptoms = s1; }
            } catch (_) {}
          }
        } catch (_) {}
      }
      setWrSymptoms(symptoms);
    } catch (_) {
      setWrChat([]); setWrFiles([]); setWrSymptoms("");
    }
  }, [detailsAppt, list]);

  const accept = async (id) => {
    const apptId = id || "";
    if (!apptId) { alert("Invalid appointment"); return; }
    try {
      await API.put(`/appointments/${String(apptId)}/accept`);
      setList((prev) => prev.map((x) => (String(x._id || x.id) === String(apptId) ? { ...x, status: "CONFIRMED" } : x)));
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
      setList((prev) => prev.map((x) => (String(x._id || x.id) === String(apptId) ? { ...x, status: "CANCELLED" } : x)));
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

  const meetLinkFor = (appt) => {
    try {
      const id = String(appt?._id || appt?.id || '');
      const doc = String(appt?.doctor?._id || appt?.doctor || '');
      const existing = String(appt?.meetingLink || '');
      const stored = id ? localStorage.getItem(`meetlink_${id}`) : null;
      const s = stored ? String(stored).replace(/[`'\"]/g, '').trim() : '';
      const e = String(existing).replace(/[`'\"]/g, '').trim();
      if (s && /^https?:\/\//.test(s)) return s;
      if (e && /^https?:\/\//.test(e)) return e;
      return '';
    } catch (_) { return ''; }
  };

  const setMeetLink = async (appt) => {
    try {
      const id = String(appt?._id || appt?.id || '');
      if (!id) return;
      const url = window.prompt('Paste meeting link (https://...)');
      if (!url) return;
      if (!/^https?:\/\//.test(String(url))) { alert('Invalid meeting link'); return; }
      localStorage.setItem(`meetlink_${id}`, String(url));
      setList((prev) => prev.map((x) => (String(x._id || x.id) === id ? { ...x, meetingLink: String(url) } : x)));
      const clean = String(url).replace(/[`'\"]/g, '').trim();
      try { meetChanRef.current && meetChanRef.current.postMessage({ id, url: clean }); } catch(_) {}
      try { await API.put(`/appointments/${id}/meet-link`, { url: clean }); } catch(_) {}
      try {
        const key = `wr_${id}_chat`;
        const chat = JSON.parse(localStorage.getItem(key) || '[]');
        const next = Array.isArray(chat) ? [...chat, String(url)] : [String(url)];
        localStorage.setItem(key, JSON.stringify(next));
      } catch (_) {}
    } catch (_) {}
  };

  const openFile = (u) => {
    try {
      const s = String(u || '');
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
    } catch (_) {}
  };

  const rows = list.map((a, i) => (
    <tr key={a._id} className="border-t">
      <td className="px-4 py-3">{i + 1}</td>
      <td className="px-4 py-3">{a.patient?.name || ""}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{a.type === "offline" ? "Clinic" : "Online"}</span>
          <span className={`inline-block text-xs px-2 py-1 rounded ${String(a.paymentStatus).toUpperCase() === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{String(a.paymentStatus).toUpperCase() === 'PAID' ? 'Paid' : 'Pending'}</span>
          {(() => {
            try {
              const d = new Date(a.date);
              const [hh, mm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
              d.setHours(hh, mm, 0, 0);
              const diff = d.getTime() - Date.now();
              const within10 = a.type === 'online' && String(a.status).toUpperCase() === 'CONFIRMED' && diff <= 10 * 60 * 1000 && diff > 0;
              if (within10) return <span className="inline-block text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">Patient waiting</span>;
            } catch(_) {}
            return null;
          })()}
        </div>
      </td>
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
      <td className="px-4 py-3">₹{a.fee || 0}</td>
      <td className="px-4 py-3">
        {String(a.status).toUpperCase() === 'PENDING' ? (
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
        ) : String(a.status).toUpperCase() === 'CANCELLED' ? (
          <span className="inline-block text-xs px-2 py-1 rounded bg-red-100 text-red-700">✕ Cancelled</span>
        ) : String(a.status).toUpperCase() === 'COMPLETED' ? (
          <div className="flex items-center gap-2">
            <span className="inline-block text-xs px-2 py-1 rounded bg-green-100 text-green-700">Completed</span>
            <button
              type="button"
              onClick={() => { window.open(`/prescription/${a._id || a.id}`, '_blank'); }}
              className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700"
            >
              View Summary
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-block text-xs px-2 py-1 rounded bg-green-100 text-green-700">✓ Accepted</span>
            {a.type === 'online' && (
              (() => {
                const start = new Date(a.date);
                const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
                start.setHours(sh, sm, 0, 0);
                const end = new Date(a.date);
                const [eh, em] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
                end.setHours(eh, em, 0, 0);
                const now = Date.now();
                const docId = String(a.doctor?._id || a.doctor || '');
                const onlineFlag = localStorage.getItem(`doctorOnlineById_${docId}`);
                const isExplicitOffline = onlineFlag === '0';
                const open = (mode) => {
                  let url = meetLinkFor(a);
                  if (!url) {
                    setMeetLink(a);
                    url = meetLinkFor(a);
                    if (!url) { alert('Meeting link not set. Click "Set Link" and paste a Google Meet URL.'); return; }
                  }
                  if (isExplicitOffline) { alert('You are offline. Set status to ONLINE to start consultation.'); return; }
                  try {
                    const uid = localStorage.getItem('userId') || '';
                    if (uid) {
                      localStorage.setItem(`doctorBusyById_${uid}`, '1');
                      API.put('/doctors/me/status', { isOnline: true, isBusy: true }).catch(() => {});
                    }
                  } catch(_) {}
                  setJoinMode(mode);
                  setConsult(a);
                  setPrescription(a.prescriptionText || '');
                };
                if (now >= end.getTime()) {
                  return (
                    <button type="button" onClick={() => alert('Time expired. Joining disabled.')} className="px-3 py-1 rounded-md border border-red-600 text-red-700">Time Expired</button>
                  );
                }
                const early = start.getTime() - 5 * 60 * 1000;
                if (now < early) {
                  return <span className="inline-block text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Available 5 min before</span>;
                }
                const mode = String(a.consultationMode || '').toLowerCase();
                if (mode === 'video') return (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => open('video')} className="px-3 py-1 rounded-md border border-green-600 text-green-700">Video Call</button>
                    <button type="button" onClick={() => setMeetLink(a)} className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700">Set Link</button>
                  </div>
                );
                if (mode === 'audio') return <button type="button" onClick={() => open('audio')} className="px-3 py-1 rounded-md border border-amber-600 text-amber-700">Audio Call</button>;
                if (mode === 'chat') return <button type="button" onClick={() => open('chat')} className="px-3 py-1 rounded-md border border-slate-600 text-slate-700">Chat Only</button>;
                return <button type="button" onClick={() => open('video')} className="px-3 py-1 rounded-md border border-green-600 text-green-700">Video Call</button>;
                
              })()
            )}
            <button
              type="button"
              onClick={() => { setConsult(a); setPrescription(a.prescriptionText || ""); }}
              className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700"
            >
              Write Prescription
            </button>
            <button
              type="button"
              onClick={() => reject(a._id || a.id, a.date, a.startTime)}
              className="px-3 py-1 rounded-md border border-red-600 text-red-700"
              title="Reject"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const id = String(a._id || a.id);
                  const { data } = await API.get(`/appointments/${id}`);
                  setDetailsAppt(data || a);
                } catch (_) {
                  setDetailsAppt(a);
                }
              }}
              className="px-3 py-1 rounded-md border border-slate-600 text-slate-700"
            >
              View Documents
            </button>
            {(() => {
              try {
                if (!a.prescriptionText) return null;
                const d = new Date(a.date);
                const [hh, mm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
                d.setHours(hh, mm, 0, 0);
                const diff = Date.now() - d.getTime();
                const max = 5 * 24 * 60 * 60 * 1000;
                if (diff < 0 || diff > max) return null;
                return (
                  <button
                    type="button"
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
                );
              } catch (_) { return null; }
            })()}
            <button
              type="button"
              onClick={async () => {
                try {
                  await API.put(`/appointments/${String(a._id || a.id)}/complete`);
                  setList((prev) => prev.map((x) => (String(x._id || x.id) === String(a._id || a.id) ? { ...x, status: 'COMPLETED' } : x)));
                } catch (e) {
                  alert(e.response?.data?.message || e.message || 'Failed to complete');
                }
              }}
              className="px-3 py-1 rounded-md border border-slate-300"
            >
              Complete
            </button>
            
          </div>
        )}
      </td>
    </tr>
  ));

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
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
              onClick={() => {
                try {
                  const uid = localStorage.getItem("userId") || "";
                  if (uid) localStorage.setItem(`doctorOnlineById_${uid}`, "0");
                } catch (_) {}
                localStorage.removeItem("token");
                nav("/doctor/login");
              }}
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
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-600">No appointments found</td>
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
      {consult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-[95vw] max-w-6xl h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-900">Live Consultation</div>
              <button
                onClick={() => {
                  try {
                    const uid = localStorage.getItem('userId') || '';
                    if (uid) {
                      localStorage.setItem(`doctorBusyById_${uid}`, '0');
                      API.put('/doctors/me/status', { isOnline: true, isBusy: false }).catch(() => {});
                    }
                  } catch(_) {}
                  setConsult(null);
                }}
                className="px-3 py-1 rounded-md border border-slate-300"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-12 h-[calc(85vh-52px)]">
              <div className="col-span-12 md:col-span-7 border-r">
                {joinMode !== 'chat' ? (
                  <div className="p-4">
                    <div className="text-sm text-slate-700 mb-2">Open meeting in a new tab to start the call.</div>
                    <button onClick={async () => {
                      let link = meetLinkFor(consult || {});
                      let url = String(link).replace(/[`'\"]/g, '').trim();
                      const id = String(consult._id || consult.id);
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
                      }
                      try { await API.put(`/appointments/${id}/meet-link`, { url }); } catch(_) {}
                      try { meetChanRef.current && meetChanRef.current.postMessage({ id, url }); } catch(_) {}
                      window.open(url, '_blank');
                    }} className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white">Open Meeting</button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => { window.open(`/prescription/${consult._id || consult.id}?print=1`, '_blank'); }}
                        className="px-3 py-1 rounded-md border border-slate-300"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied'); } catch(_) {}
                        }}
                        className="px-3 py-1 rounded-md border border-indigo-600 text-indigo-700"
                      >
                        Share
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied for pharmacy'); } catch(_) {}
                        }}
                        className="px-3 py-1 rounded-md border border-slate-300"
                      >
                        Share to pharmacy
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied for lab tests'); } catch(_) {}
                        }}
                        className="px-3 py-1 rounded-md border border-slate-300"
                      >
                        Share for lab tests
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-700">Chat only mode</div>
                )}
                <div className="px-4 py-3 border-t">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-900 font-semibold mb-1">Patient history</div>
                      <div className="space-y-2">
                        {consHistory.length === 0 ? (
                          <div className="text-sm text-slate-600">No previous prescriptions</div>
                        ) : (
                          consHistory.map((x) => (
                            <div key={x._id} className="border rounded-md p-2">
                              <div className="text-xs text-slate-600">{x.date} {x.startTime}</div>
                              <div className="text-sm text-slate-700 truncate">{x.prescriptionText}</div>
                              <div className="mt-1">
                                <button onClick={() => window.open(`/prescription/${x._id || x.id}`, '_blank')} className="px-2 py-1 rounded-md border border-indigo-600 text-indigo-700 text-xs">Open</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-slate-900 font-semibold mb-1">Reports</div>
                    <div className="space-y-2">
                      {consFiles.length === 0 ? (
                        <div className="text-sm text-slate-600">No reports</div>
                      ) : (
                        consFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                            <div className="text-sm text-slate-700 truncate">{f.name}</div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openFile(f.url)} className="px-2 py-1 rounded-md border border-slate-300 text-sm">Open</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-slate-900 font-semibold mb-2">Chat</div>
                    <div className="h-32 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                      {chat.length === 0 ? (
                        <div className="text-slate-600 text-sm">No messages</div>
                      ) : (
                        chat.map((m, idx) => (
                          <div key={idx} className="text-sm text-slate-700">{m}</div>
                        ))
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="Type message"
                        className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => { if (chatText.trim()) { setChat((prev) => [...prev, chatText.trim()]); setChatText(""); } }}
                        className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-5">
                <div className="h-full overflow-y-auto">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { if (api) api.executeCommand('toggleAudio'); }}
                        className="px-3 py-1 rounded-md border border-slate-300"
                      >
                        Mute/Unmute
                      </button>
                      <button
                        onClick={() => { if (api) api.executeCommand('hangup'); setConsult(null); }}
                        className="px-3 py-1 rounded-md border border-red-600 text-red-700"
                      >
                        End Call
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-slate-900 font-semibold mb-2">Write Prescription</div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Medicines</label>
                        <textarea
                          value={rxMedicines}
                          onChange={(e) => setRxMedicines(e.target.value)}
                          rows={3}
                          className="w-full border border-slate-300 rounded-md p-3 text-sm"
                          placeholder="e.g., Paracetamol 500mg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Dosage</label>
                        <input
                          value={rxDosage}
                          onChange={(e) => setRxDosage(e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          placeholder="e.g., 1 tablet twice daily"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Duration</label>
                        <input
                          value={rxDuration}
                          onChange={(e) => setRxDuration(e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          placeholder="e.g., 5 days"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Tests if needed</label>
                        <textarea
                          value={rxTests}
                          onChange={(e) => setRxTests(e.target.value)}
                          rows={2}
                          className="w-full border border-slate-300 rounded-md p-3 text-sm"
                          placeholder="e.g., CBC, LFT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Diagnosis</label>
                        <input
                          value={rxDiagnosis}
                          onChange={(e) => setRxDiagnosis(e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          placeholder="e.g., Viral fever"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Lifestyle advice</label>
                        <textarea
                          value={rxAdvice}
                          onChange={(e) => setRxAdvice(e.target.value)}
                          rows={2}
                          className="w-full border border-slate-300 rounded-md p-3 text-sm"
                          placeholder="e.g., Diet, sleep, exercise recommendations"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Notes</label>
                        <textarea
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          rows={3}
                          className="w-full border border-slate-300 rounded-md p-3 text-sm"
                          placeholder="Additional instructions"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const id = String(consult._id || consult.id);
                            const parts = [
                              rxMedicines ? `Medicines: ${rxMedicines}` : "",
                              rxDosage ? `Dosage: ${rxDosage}` : "",
                              rxDuration ? `Duration: ${rxDuration}` : "",
                              rxTests ? `Tests: ${rxTests}` : "",
                              rxDiagnosis ? `Diagnosis: ${rxDiagnosis}` : "",
                              rxAdvice ? `Lifestyle advice: ${rxAdvice}` : "",
                              prescription ? `Notes: ${prescription}` : ""
                            ].filter(Boolean);
                            const text = parts.join("\n");
                            await API.post(`/appointments/${id}/prescription`, { text });
                            try {
                              const key = String(id);
                              const prev = JSON.parse(localStorage.getItem(`wr_${key}_prevpres`) || '[]');
                              const label = `Prescription ${consult.date} ${consult.startTime}`;
                              const item = { name: label, url: `${window.location.origin}/prescription/${key}`, by: "doctor" };
                              const next = Array.isArray(prev) ? [...prev, item] : [item];
                              localStorage.setItem(`wr_${key}_prevpres`, JSON.stringify(next));
                              try { const chan = new BroadcastChannel('prescriptions'); chan.postMessage({ id: key, item }); chan.close(); } catch (_) {}
                            } catch (_) {}
                            alert('Saved & sent to patient');
                            try { window.open(`/prescription/${id}?print=1`, '_blank'); } catch(_) {}
                          } catch (e) {
                            alert(e.response?.data?.message || e.message || 'Failed to save');
                          }
                        }}
                        className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save & Send to Patient
                      </button>
                      <button
                        onClick={() => { window.open(`/prescription/${consult._id || consult.id}`, '_blank'); }}
                        className="px-3 py-2 rounded-md border border-slate-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => { window.open(`/prescription/${consult._id || consult.id}?print=1`, '_blank'); }}
                        className="px-3 py-2 rounded-md border border-slate-300"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied'); } catch(_) {}
                        }}
                        className="px-3 py-2 rounded-md border border-indigo-600 text-indigo-700"
                      >
                        Share
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied for pharmacy'); } catch(_) {}
                        }}
                        className="px-3 py-2 rounded-md border border-slate-300"
                      >
                        Share to pharmacy
                      </button>
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/prescription/${consult._id || consult.id}`;
                          try { await navigator.clipboard.writeText(url); alert('Link copied for lab tests'); } catch(_) {}
                        }}
                        className="px-3 py-2 rounded-md border border-slate-300"
                      >
                        Share for lab tests
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {detailsAppt && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailsAppt(null); }}
        >
          <div className="bg-white rounded-xl border border-slate-200 w-[95vw] max-w-lg h-[75vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold text-slate-900">Patient Details</div>
              <button
                type="button"
                onClick={() => setDetailsAppt(null)}
                className="px-3 py-1 rounded-md border border-slate-300"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-700 text-sm">Patient name</div>
                  <div className="text-slate-900 font-semibold">{detailsAppt.patient?.name || 'User'}</div>
                </div>
                <div>
                  <div className="text-slate-700 text-sm">Age / Gender</div>
                  <div className="text-slate-900 font-semibold">{(() => {
                    const p = detailsAppt.patient || {};
                    let ageStr = '';
                    try {
                      if (p.age !== undefined && p.age !== null && p.age !== '') ageStr = String(p.age);
                      else {
                        const pid = String(p._id || detailsAppt.patient || '');
                        const locAge = localStorage.getItem(`userAgeById_${pid}`) || '';
                        if (locAge) ageStr = String(locAge);
                        else {
                          const dob = p.birthday || p.dob || p.dateOfBirth || localStorage.getItem(`userDobById_${pid}`) || '';
                          if (dob) {
                            const d = new Date(dob);
                            if (!Number.isNaN(d.getTime())) {
                              const t = new Date();
                              let age = t.getFullYear() - d.getFullYear();
                              const m = t.getMonth() - d.getMonth();
                              if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
                              ageStr = String(age);
                            }
                          }
                        }
                      }
                    } catch(_) {}
                    const gender = p.gender || p.sex || '';
                    return [ageStr, gender].filter(Boolean).join(' / ');
                  })()}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-slate-900 font-semibold mb-1">Symptoms (reason for visit)</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{wrSymptoms || '--'}</div>
              </div>
              <div className="mt-4">
                <div className="text-slate-900 font-semibold mb-1">Previous prescriptions</div>
                <div className="space-y-2">
                  {(() => {
                    const items = [];
                    if (items.length === 0) return <div className="text-sm text-slate-600">No previous prescriptions</div>;
                    return items.slice(0, 5).map((x) => (
                      <div key={x._id} className="border rounded-md p-2">
                        <div className="text-xs text-slate-600">{x.date} {x.startTime}</div>
                        <div className="text-sm text-slate-700 truncate">{x.prescriptionText}</div>
                        <div className="mt-1">
                          <button onClick={() => window.open(`/prescription/${x._id || x.id}`, '_blank')} className="px-2 py-1 rounded-md border border-indigo-600 text-indigo-700 text-xs">Open</button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-slate-900 font-semibold mb-1">Medical reports uploaded</div>
                <div className="space-y-2">
                  {wrFiles.length === 0 ? (
                    <div className="text-sm text-slate-600">No reports uploaded</div>
                  ) : (
                    wrFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                        <div className="text-sm text-slate-700 truncate">{f.name}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openFile(f.url)} className="px-2 py-1 rounded-md border border-slate-300 text-sm">Open</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-slate-900 font-semibold mb-1">Pre-call chat</div>
                <div className="h-28 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                  {wrChat.length === 0 ? (
                    <div className="text-slate-600 text-sm">No messages</div>
                  ) : (
                    wrChat.map((m, idx) => (
                      <div key={idx} className="text-sm text-slate-700">{m}</div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2 sticky bottom-0 bg-white py-3">
                  <input
                    value={wrText}
                    onChange={(e) => setWrText(e.target.value)}
                    placeholder="Type a quick message"
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (!detailsAppt) return;
                      if (wrText.trim()) {
                        const id = String(detailsAppt._id || detailsAppt.id);
                        const next = [...wrChat, wrText.trim()];
                        setWrChat(next);
                        try { localStorage.setItem(`wr_${id}_chat`, JSON.stringify(next)); } catch(_) {}
                        setWrText("");
                      }
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
                            <button onClick={() => openFile(f.url)} className="px-2 py-1 rounded-md border border-slate-300 text-sm">Open</button>
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
    </div>
  );
}
