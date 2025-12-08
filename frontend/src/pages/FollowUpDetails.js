import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function FollowUpDetails({ actor = 'patient', backTo = '/appointments' }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fuChat, setFuChat] = useState([]);
  const [fuText, setFuText] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get(`/appointments/${id}`);
        setAppt(data || null);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Failed to load appointment");
      }
      try {
        const s1 = String(localStorage.getItem(`wr_${id}_symptoms`) || "");
        const s2 = String(localStorage.getItem(`fu_${id}_symptoms`) || "");
        setSymptoms(s1);
        setSummary(s2);
        const fu = JSON.parse(localStorage.getItem(`fu_${id}_chat`) || "[]");
        const fuN = (Array.isArray(fu) ? fu : []).map((it) => (typeof it === 'string' ? it : String(it?.text || ''))).filter(Boolean);
        setFuChat(fuN);
        const wrF = JSON.parse(localStorage.getItem(`wr_${id}_files`) || "[]");
        const fuF = JSON.parse(localStorage.getItem(`fu_${id}_files`) || "[]");
        setFiles(([]).concat(Array.isArray(wrF) ? wrF : [], Array.isArray(fuF) ? fuF : []));
      } catch (_) { setFuChat([]); setFiles([]); }
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    try {
      const origin = String(API.defaults.baseURL || '').replace(/\/(api)?$/, '');
      const w = window;
      const socket = w.io ? w.io(origin, { transports: ["websocket", "polling"], auth: { token: localStorage.getItem('token') || '' } }) : null;
      if (socket) socketRef.current = socket;
      return () => { try { socket && socket.close(); } catch(_) {} };
    } catch(_) { return () => {}; }
  }, []);

  const patientName = appt?.patient?.name || "";
  const patientGender = (() => {
    try {
      const p = appt?.patient || {};
      const pid = String(p._id || appt?.patient || "");
      const gender = p.gender || p.sex || (pid ? localStorage.getItem(`userGenderById_${pid}`) || "" : "");
      return gender || "";
    } catch (_) { return ""; }
  })();
  const patientAge = (() => {
    try {
      const p = appt?.patient || {};
      const pid = String(p._id || appt?.patient || "");
      if (p.age !== undefined && p.age !== null && String(p.age).trim() !== "") return String(p.age);
      const locAge = pid ? localStorage.getItem(`userAgeById_${pid}`) || "" : "";
      if (locAge) return String(locAge);
      const dob = p.birthday || p.dob || p.dateOfBirth || p.birthDate || (pid ? localStorage.getItem(`userDobById_${pid}`) || "" : "");
      if (!dob) return "";
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) return "";
      const t = new Date();
      let age = t.getFullYear() - d.getFullYear();
      const m = t.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
      return String(age);
    } catch (_) { return ""; }
  })();

  return (
    <div className="page-gradient">
      <div className="max-w-3xl mx-auto px-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-800 bg-clip-text text-transparent">Follow-up</div>
          <button onClick={() => nav(backTo)} className="px-3 py-1 rounded-md border border-slate-300">Back</button>
        </div>
        {loading && <div className="text-slate-600">Loading...</div>}
        {error && !loading && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {!loading && (
          <div className="glass-card rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-900 font-semibold mb-1">Patient name</div>
                <div className="text-sm text-slate-900">{patientName || 'You'}</div>
              </div>
              <div>
                <div className="text-slate-900 font-semibold mb-1">Age / Gender</div>
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{patientAge || '--'}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">{patientGender || '--'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-slate-900 font-semibold mb-1">Symptoms (reason for visit)</div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap bg-blue-50/50 rounded-xl p-3">{String(symptoms || '').trim() || '--'}</div>
            </div>

            <div className="mt-4">
              <div className="text-slate-900 font-semibold mb-1">Health issue summary</div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap bg-blue-50/50 rounded-xl p-3">{String(summary || '').trim() || '--'}</div>
            </div>

            {null}

            <div className="mt-6">
              <div className="text-slate-900 font-semibold mb-2">Follow-up chat</div>
              <div className="h-28 overflow-y-auto border border-blue-200 rounded-xl p-3 bg-white/70">
                {fuChat.length === 0 ? (
                  <div className="text-slate-500 text-sm">No messages</div>
                ) : (
                  fuChat.map((m, idx) => (<div key={idx} className="text-sm text-slate-800">{m}</div>))
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={fuText} onChange={(e) => setFuText(e.target.value)} placeholder="Type a quick message" className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white/70" />
                <button
                  onClick={() => {
                    const t = fuText.trim();
                    if (!t) return;
                    const next = [...fuChat, t];
                    setFuChat(next);
                    try { localStorage.setItem(`fu_${id}_chat`, JSON.stringify(next)); } catch(_) {}
                    try { localStorage.setItem('lastChatApptId', String(id)); } catch(_) {}
                    try { const chan = new BroadcastChannel('chatmsg'); chan.postMessage({ apptId: String(id), actor, kind: 'followup', text: t }); chan.close(); } catch(_) {}
                    try { socketRef.current && socketRef.current.emit('chat:new', { apptId: String(id), actor, kind: 'followup', text: t }); } catch(_) {}
                    setFuText("");
                  }}
                  className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
                >Send</button>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-slate-900 font-semibold mb-1">Medical reports uploaded</div>
              <div className="mt-2 space-y-2">
                {files.length === 0 ? (
                  <div className="text-slate-500 text-sm">No reports uploaded</div>
                ) : (
                  files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between border border-blue-200 rounded-xl p-3 bg-white/70">
                      <div className="flex items-center gap-3">
                        {(String(f.url || '').startsWith('data:image')) && (
                          <img src={f.url} alt={f.name} className="h-10 w-10 object-cover rounded" />
                        )}
                        <div className="text-sm text-slate-800 truncate max-w-[12rem]">{f.name}</div>
                      </div>
                      <button onClick={() => { try { setFilePreview({ url: f.url, name: f.name }); setIsFullPreview(true); } catch(_) {} }} className="px-2 py-1 rounded-md border border-blue-200 text-blue-700 text-sm">Open</button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {filePreview && isFullPreview && (
              <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center">
                <button type="button" onClick={() => setIsFullPreview(false)} className="absolute top-4 right-4 px-3 py-1 rounded-md border border-slate-300 bg-white/90">Close</button>
                <img src={String(filePreview.url || '')} alt="" className="w-[98vw] h-[90vh] object-contain shadow-2xl" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
