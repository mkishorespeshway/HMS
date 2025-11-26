import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function AdminAddDoctor() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specializations: "",
    clinic: "",
    city: "",
    address: "",
    fees: "",
    slotDurationMins: "15",
    experienceYears: "",
    about: "",
    password: "",
    photoBase64: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        specializations: form.specializations,
        clinic: form.clinic,
        city: form.city,
        address: form.address,
        fees: form.fees,
        slotDurationMins: form.slotDurationMins,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        about: form.about,
        password: form.password,
        photoBase64: form.photoBase64,
      };
      await API.post("/admin/doctors", payload);
      alert("Doctor created successfully.");
      setForm({ name: "", email: "", phone: "", specializations: "", clinic: "", city: "", address: "", fees: "", slotDurationMins: "15", experienceYears: "", about: "", password: "", photoBase64: "" });
      nav("/admin/doctors");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create doctor");
    }
  };

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
              <Link to="/admin/dashboard" className="block px-3 py-2 rounded-md hover:bg-slate-50">Dashboard</Link>
              <Link to="/admin/appointments" className="block px-3 py-2 rounded-md hover:bg-slate-50">Appointments</Link>
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Add Doctor</div>
              
              <Link to="/admin/doctors" className="block px-3 py-2 rounded-md hover:bg-slate-50">Doctors List</Link>
            </nav>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Add Doctor</h1>
            <button
              onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full"
            >
              Logout
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
            <form onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input name="name" value={form.name} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Dr. John Doe" />

          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input name="email" value={form.email} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="doctor@example.com" />

          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="+91-XXXXXXXXXX" />

          <label className="block text-sm font-medium text-slate-700 mb-1">Specializations</label>
          {(() => {
            const SPECIALTIES = [
              "General Physician",
              "Gynecologist",
              "Dermatologist",
              "Pediatrician",
              "Neurologist",
              "Cardiologist",
              "Dermatologist",
               "eneral Physician",
              "Gynecologist",
              "Pediatrician",
              "Orthopedic Surgeon",
              "Cardiologist",
              "Neurologist",
            "Gastroenterologist",
             "ENT Specialist",
             "Dentist",
            "Psychiatrist",
            "Diabetologist",
            "Endocrinologist",
            "Pulmonologist",
            "Nephrologist",
            "Urologist",
            "Ophthalmologist",
            "Oncologist",
            "Rheumatologist",
            "Physiotherapist" 
            ];
            return (
              <select
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value || "";
                  if (!val) return;
                  setForm((f) => ({
                    ...f,
                    specializations: f.specializations ? `${f.specializations}, ${val}` : val,
                  }));
                }}
                className="border border-slate-300 rounded-md p-2 w-full mb-2"
              >
                <option value="">Select specialization</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            );
          })()}
          <input name="specializations" value={form.specializations} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="e.g., Cardiology, Dermatology" />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Clinic</label>
              <input name="clinic" value={form.clinic} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Clinic name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input name="city" value={form.city} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="City" />
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea name="address" value={form.address} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Clinic address" rows={3} />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fees</label>
              <input name="fees" value={form.fees} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="₹" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (mins)</label>
              <input name="slotDurationMins" value={form.slotDurationMins} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
              <input name="experienceYears" value={form.experienceYears} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="e.g., 5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Set doctor password" />
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-1">About</label>
          <textarea name="about" value={form.about} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Short bio" rows={4} />

          <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image</label>
          <input type="file" accept="image/*" className="border border-slate-300 rounded-md p-2 w-full mb-3" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setForm((f) => ({ ...f, photoBase64: String(reader.result || "") }));
            };
            reader.readAsDataURL(file);
          }} />
          {form.photoBase64 && (
            <div className="mb-3">
              <img src={form.photoBase64} alt="Selected" className="w-full h-40 object-cover rounded-md border border-slate-200" />
            </div>
          )}

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">Create Doctor</button>
        </form>
      </div>
        </main>
      </div>
    </div>
  );
}
