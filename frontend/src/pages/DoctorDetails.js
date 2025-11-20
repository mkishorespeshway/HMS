import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";


export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [related, setRelated] = useState([]);
  const [type, setType] = useState("offline");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const nav = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    API.get(`/doctors`, { params: { user: id } }).then((res) => setDoctor(res.data[0]));
  }, [id]);

  const name = doctor?.user?.name || "Doctor";
  const specPrimary = doctor?.specializations?.[0] || "General physician";
  const experienceYears = doctor?.experienceYears ? `${doctor?.experienceYears} Years` : undefined;
  const about = doctor?.about || "Focuses on preventive medicine, early diagnosis, and effective treatment strategies.";
  const fee = doctor?.consultationFees ?? 0;
  const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=640&auto=format&fit=crop";
  const photo = doctor?.photoBase64 || DEFAULT_PHOTO;

  useEffect(() => {
    if (!doctor) return;
    const primary = (doctor.specializations && doctor.specializations[0]) || undefined;
    API.get('/doctors', { params: { specialization: primary } })
      .then((res) => {
        const others = (res.data || []).filter((d) => String(d.user?._id) !== String(doctor.user?._id));
        setRelated(others.slice(0, 4));
      })
      .catch(() => setRelated([]));
  }, [doctor]);

  useEffect(() => {
    if (!doctor || !selectedDate) return;
    const uid = doctor?.user?._id;
    API.get(`/appointments/slots/${uid}`, { params: { date: selectedDate } })
      .then((res) => setSlots(res.data || []))
      .catch(() => setSlots([]));
  }, [doctor, selectedDate]);

  if (!doctor) return <div className="max-w-7xl mx-auto px-4 mt-8">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div>
            <div className="bg-indigo-50 rounded-xl overflow-hidden border border-indigo-100">
              <div className="relative">
                <img
                  src={photo}
                  alt="Doctor"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_PHOTO) e.currentTarget.src = DEFAULT_PHOTO;
                  }}
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold">{`Dr. ${name}`}</h2>
            </div>
            <div className="mt-1 text-slate-700">{`MBBS - ${specPrimary}`}{experienceYears ? ` • ${experienceYears}` : ""}</div>
            <div className="mt-4">
              <div className="font-semibold">About</div>
              <p className="text-slate-700 text-sm mt-1">{about}</p>
            </div>
            <div className="mt-4 text-slate-700">Appointment fee: ₹{fee}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-slate-900 font-semibold mb-4">Booking slots</div>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setType((v) => (v === "offline" ? "online" : "offline"))}
              className={`h-9 w-16 rounded-full ${type === "offline" ? "bg-indigo-600" : "bg-slate-300"}`}
            />
            <div className="flex items-center gap-3">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const label = d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
                const day = String(d.getDate()).padStart(2, "0");
                const val = d.toISOString().slice(0, 10);
                const isSel = selectedDate === val;
                return (
                  <button
                    key={val}
                    onClick={() => setSelectedDate(val)}
                    className={`px-4 py-3 rounded-full border ${isSel ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-900 border-slate-300"}`}
                  >
                    <div className="text-xs">{label}</div>
                    <div className="text-base">{day}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {slots.length === 0 && selectedDate && (
              <div className="text-slate-600">No slots available</div>
            )}
            {(() => {
              const todayISO = new Date().toISOString().slice(0, 10);
              const now = new Date();
              const nowMin = now.getHours() * 60 + now.getMinutes();
              const displaySlots = selectedDate === todayISO
                ? slots.filter((s) => {
                    const [hh, mm] = String(s.start || "00:00").split(":").map((x) => Number(x));
                    return hh * 60 + mm > nowMin;
                  })
                : slots;
              return displaySlots.map((s) => {
                const key = `${s.start}-${s.end}`;
                const sel = selectedSlot && selectedSlot.start === s.start && selectedSlot.end === s.end;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSlot(s)}
                    className={`px-4 py-2 rounded-full border ${sel ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-900 border-slate-300"}`}
                  >
                    {s.start} - {s.end}
                  </button>
                );
              });
            })()}
          </div>

          <button
            onClick={async () => {
              if (!isLoggedIn) { nav('/login'); return; }
              if (!selectedDate || !selectedSlot) { nav(`/book/${doctor?.user?._id}`); return; }
              try {
                const { data } = await API.post("/appointments", {
                  doctorId: doctor?.user?._id,
                  date: selectedDate,
                  startTime: selectedSlot.start,
                  endTime: selectedSlot.end,
                  type,
                  beneficiaryType: "self",
                });
                nav(`/appointments`);
              } catch (err) {
                alert(err.response?.data?.message || err.message);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto px-6 py-3 rounded-full"
          >
            {isLoggedIn ? "Book an appointment" : "Login to book"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-semibold text-slate-900 text-center">Related Doctors</h3>
        <p className="text-slate-600 text-center mt-2">Simply browse through our extensive list of trusted doctors.</p>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((d) => (
            <div key={d._id} className="bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={d.photoBase64 || ((process.env.PUBLIC_URL || "") + "/doctor3.jpeg")}
                  alt="Doctor"
                  className="w-full h-56 object-cover"
                  onError={(e) => { e.currentTarget.src = "https://raw.githubusercontent.com/abhi051002/hms-fullstack/main/frontend/src/readme_images/doctorProfile.png"; }}
                />
                <span className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Available</span>
              </div>
              <div className="p-4">
                <div className="text-base font-semibold">{`Dr. ${d.user?.name || ''}`}</div>
                <div className="text-sm text-slate-600">{(d.specializations && d.specializations[0]) || "--"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-lg">Prescripto</div>
              <p className="mt-3 text-slate-600 text-sm">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                It has been the industry's standard dummy text ever since the 1500s.
              </p>
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
              <div className="text-slate-700 text-sm">+0-000-000-000</div>
              <div className="text-slate-700 text-sm">greatstackdev@gmail.com</div>
            </div>
          </div>
          <hr className="my-6 border-slate-200" />
          <div className="text-center text-slate-600 text-sm">Copyright 2024 © GreatStack.dev - All Right Reserved.</div>
        </div>
      </section>
    </div>
  );
}