import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import API from "../api";

export default function Prescription() {
  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const [appt, setAppt] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/appointments/${id}`);
        setAppt(data);
        const docId = String(data?.doctor?._id || data?.doctor || "");
        if (docId) {
          try {
            const profs = await API.get(`/doctors?user=${docId}`);
            const first = Array.isArray(profs?.data) ? profs.data[0] : null;
            setProfile(first || null);
          } catch (_) {}
        }
      } catch (e) {
        alert(e.response?.data?.message || e.message);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("print") === "1") {
      const t = setTimeout(() => { try { window.print(); } catch(_) {} }, 300);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  const clinicName = useMemo(() => String(profile?.clinic?.name || "").trim(), [profile]);
  const clinicCity = useMemo(() => String(profile?.clinic?.city || "").trim(), [profile]);
  const doctorName = useMemo(() => `Dr. ${appt?.doctor?.name || ''}`, [appt]);
  const regNo = useMemo(() => String(profile?.registrationNumber || "").trim(), [profile]);
  const patientName = useMemo(() => String(appt?.patient?.name || "").trim(), [appt]);
  const when = useMemo(() => `${appt?.date || ''} ${appt?.startTime || ''}-${appt?.endTime || ''}`, [appt]);
  const doctorQuals = useMemo(() => (Array.isArray(profile?.qualifications) ? profile.qualifications.join(', ') : ''), [profile]);
  const doctorSpecs = useMemo(() => (Array.isArray(profile?.specializations) ? profile.specializations.join(', ') : ''), [profile]);
  const clinicAddress = useMemo(() => String(profile?.clinic?.address || '').trim(), [profile]);
  const patientAge = useMemo(() => {
    try {
      const pid = String(appt?.patient?._id || appt?.patient || '');
      const val = localStorage.getItem(`userAgeById_${pid}`) || '';
      return String(val || '').trim();
    } catch(_) { return ''; }
  }, [appt]);
  const patientGender = useMemo(() => {
    try {
      const pid = String(appt?.patient?._id || appt?.patient || '');
      const val = localStorage.getItem(`userGenderById_${pid}`) || '';
      return String(val || '').trim();
    } catch(_) { return ''; }
  }, [appt]);
  const apptType = useMemo(() => String(appt?.type || '').trim(), [appt]);
  const symptomsText = useMemo(() => {
    const s1 = String(appt?.patientSymptoms || '').trim();
    const s2 = String(appt?.patientSummary || '').trim();
    return s1 || s2 || '';
  }, [appt]);

  const parsed = useMemo(() => {
    const src = String(appt?.prescriptionText || '').split(/\n+/).map((l) => l.trim());
    const getVal = (label) => {
      const row = src.find((x) => x.toLowerCase().startsWith(label.toLowerCase()));
      if (!row) return '';
      const parts = row.split(':');
      return String(parts.slice(1).join(':') || '').trim();
    };
    const obj = {
      medicines: getVal('Medicines'),
      dosage: getVal('Dosage'),
      duration: getVal('Duration'),
      tests: getVal('Tests'),
      diagnosis: getVal('Diagnosis'),
      advice: getVal('Lifestyle advice') || getVal('Advice'),
      notes: getVal('Notes'),
    };
    return obj;
  }, [appt]);

  const followUpDate = useMemo(() => {
    try {
      const d = new Date(appt?.date || '');
      if (Number.isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 5);
      return d.toISOString().slice(0, 10);
    } catch(_) { return ''; }
  }, [appt]);

return (
  <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">Prescription</h2>
      {appt && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              try {
                if (window.opener) { window.close(); return; }
                if (window.history.length > 1) { window.history.back(); return; }
              } catch (_) {}
              nav('/appointments');
            }}
            className="px-3 py-2 rounded-md border border-slate-300"
          >
            Close
          </button>
          <button onClick={() => { try { window.print(); } catch(_) {} }} className="px-3 py-2 rounded-md border border-slate-300">Download PDF</button>
          <button
            onClick={async () => {
              const key = String(id);
              const viewUrl = `${window.location.origin}/prescription/${id}`;
              try {
                const prev = JSON.parse(localStorage.getItem(`wr_${key}_prevpres`) || '[]');
                const label = `Prescription ${when}`;
                const item = { name: label, url: viewUrl, by: "doctor" };
                const next = Array.isArray(prev) ? [...prev, item] : [item];
                localStorage.setItem(`wr_${key}_prevpres`, JSON.stringify(next));
                try { const chan = new BroadcastChannel('prescriptions'); chan.postMessage({ id: key, item }); chan.close(); } catch (_) {}
              } catch (_) {}
              try { await API.post(`/appointments/${id}/prescription`, { text: appt?.prescriptionText || "" }); } catch (_) {}
              try {
                if (navigator.share) {
                  await navigator.share({ title: 'Prescription', url: viewUrl });
                } else {
                  await navigator.clipboard.writeText(viewUrl);
                }
              } catch (_) {}
              alert('Sent to Prescriptions')
            }}
            className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Share
          </button>
        </div>
      )}
    </div>
    {!appt && <p className="text-slate-600 mt-3">Loading...</p>}
    {appt && (
      <div className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">{clinicName || 'Clinic/Hospital'}</div>
            <div className="text-slate-700 text-sm">{clinicCity}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-900 font-semibold">{doctorName}</div>
          </div>
        </div>
        <hr className="my-3 border-slate-200" />
        <div className="flex items-center justify-between text-sm text-slate-700">
          <div>Patient: <span className="text-slate-900">{patientName || '--'}</span></div>
          <div>Date: <span className="text-slate-900">{when}</span></div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-slate-900 font-semibold">Doctor Details</div>
            <div className="text-sm text-slate-700">Name: <span className="text-slate-900">{doctorName || '--'}</span></div>
            <div className="text-sm text-slate-700">Qualification: <span className="text-slate-900">{doctorQuals || '--'}</span></div>
            <div className="text-sm text-slate-700">Specialization: <span className="text-slate-900">{doctorSpecs || '--'}</span></div>
            <div className="text-sm text-slate-700">Clinic/Hospital: <span className="text-slate-900">{clinicName || '--'}</span></div>
            <div className="text-sm text-slate-700">Clinic Address: <span className="text-slate-900">{clinicAddress || '--'}</span></div>
            <div className="text-sm text-slate-700">City: <span className="text-slate-900">{clinicCity || '--'}</span></div>
          </div>
          <div className="space-y-2">
            <div className="text-slate-900 font-semibold">Patient Details</div>
            <div className="text-sm text-slate-700">Name: <span className="text-slate-900">{patientName || '--'}</span></div>
            <div className="text-sm text-slate-700">Age: <span className="text-slate-900">{patientAge || '--'}</span></div>
            <div className="text-sm text-slate-700">Gender: <span className="text-slate-900">{patientGender || '--'}</span></div>
            <div className="text-sm text-slate-700">Consultation Date: <span className="text-slate-900">{when || '--'}</span></div>
            <div className="text-sm text-slate-700">Appointment Type: <span className="text-slate-900">{apptType ? (apptType === 'online' ? 'Online' : 'Offline') : '--'}</span></div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-slate-900 font-semibold">Symptoms (Chief Complaints)</div>
          <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap border border-slate-300 rounded-md p-3 bg-slate-50">{symptomsText || '--'}</div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-slate-900 font-semibold">Diagnosis</div>
            <div className="mt-2 text-sm text-slate-700 border border-slate-300 rounded-md p-3 bg-slate-50">{parsed.diagnosis || '--'}</div>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">Tests / Investigations</div>
            <div className="mt-2 text-sm text-slate-700 border border-slate-300 rounded-md p-3 bg-slate-50">{parsed.tests || '--'}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-slate-900 font-semibold">Prescription (Medicines)</div>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <div className="text-sm text-slate-700">Medicine Name: <span className="text-slate-900">{parsed.medicines || '--'}</span></div>
            <div className="text-sm text-slate-700">Dosage: <span className="text-slate-900">{parsed.dosage || '--'}</span></div>
            <div className="text-sm text-slate-700">Frequency: <span className="text-slate-900">--</span></div>
            <div className="text-sm text-slate-700">Duration: <span className="text-slate-900">{parsed.duration || '--'}</span></div>
            <div className="text-sm text-slate-700">Route: <span className="text-slate-900">--</span></div>
            <div className="text-sm text-slate-700">Before/After food: <span className="text-slate-900">--</span></div>
          </div>
          <div className="mt-2 text-sm text-slate-700">Notes: <span className="text-slate-900">{parsed.notes || '--'}</span></div>
        </div>

        <div className="mt-6">
          <div className="text-slate-900 font-semibold">Advice / Instructions</div>
          <div className="mt-2 text-sm text-slate-700 border border-slate-300 rounded-md p-3 bg-slate-50">{parsed.advice || '--'}</div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-slate-900 font-semibold">Follow-up</div>
            <div className="mt-2 text-sm text-slate-700 border border-slate-300 rounded-md p-3 bg-slate-50">
              <div>Follow-up date: <span className="text-slate-900">{followUpDate || '--'}</span></div>
              <div>Review if symptoms worsen</div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-slate-700 text-sm">Digital signature</div>
              <div className="text-slate-900 font-semibold">{doctorName}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              const url = `${window.location.origin}/prescription/${id}`;
              try { await navigator.clipboard.writeText(url); alert('Link copied for pharmacy'); } catch(_) {}
            }}
            className="px-3 py-2 rounded-md border border-slate-300"
          >
            Share to pharmacy
          </button>
          <button
            onClick={async () => {
              const url = `${window.location.origin}/prescription/${id}`;
              try { await navigator.clipboard.writeText(url); alert('Link copied for lab'); } catch(_) {}
            }}
            className="px-3 py-2 rounded-md border border-slate-300"
          >
            Share for lab tests
          </button>
        </div>
      </div>
    )}
  </div>
);
}
