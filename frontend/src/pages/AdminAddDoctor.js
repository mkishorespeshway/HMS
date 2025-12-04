import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import Logo from "../components/Logo";

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
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "phone") v = String(value).replace(/\D/g, "").slice(0, 10);
    if (name === "fees" || name === "slotDurationMins" || name === "experienceYears") v = String(value).replace(/\D/g, "");
    setForm((f) => ({ ...f, [name]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || ""))) errs.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(String(form.phone || ""))) errs.phone = "Phone must start 6-9 and be 10 digits";
    if (form.fees && !/^\d+$/.test(String(form.fees))) errs.fees = "Fees must be digits";
    if (form.slotDurationMins && !/^\d+$/.test(String(form.slotDurationMins))) errs.slot = "Slot must be digits";
    if (form.experienceYears && !/^\d+$/.test(String(form.experienceYears))) errs.exp = "Experience must be digits";
    const passOk = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/.test(String(form.password || ""));
    if (!passOk) errs.password = "Password 6-12 chars, letters & numbers";
    setErrors(errs);
    if (Object.keys(errs).length) return;
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

  const linkClass = (active) =>
    active
      ? "relative px-4 py-2 text-blue-700 font-bold bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm"
      : "relative px-4 py-2 text-gray-600 hover:text-blue-600 font-medium rounded-xl hover:bg-blue-50/50 transition-all duration-300 hover:scale-105";

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xl border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo Section */}
            <Link to="/admin/dashboard" className="flex items-center gap-4 group hover:scale-105 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-white/20">
                <div className="text-white">
                  <Logo size={20} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  HospoZen
                </span>
              </div>
            </Link>

            {/* Enhanced Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              {(() => {
                const p = window.location.pathname;
                return (
                  <>
                    <Link to="/admin/dashboard" className={linkClass(p === "/admin/dashboard")}>
                      <span className="relative z-10">Dashboard</span>
                      {p === "/admin/dashboard" && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                    <Link to="/admin/appointments" className={linkClass(p.startsWith("/admin/appointments"))}>
                      <span className="relative z-10">Appointments</span>
                      {p.startsWith("/admin/appointments") && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                    <Link to="/admin/add-doctor" className={linkClass(p.startsWith("/admin/add-doctor"))}>
                      <span className="relative z-10">Add Doctor</span>
                      {p.startsWith("/admin/add-doctor") && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>

                    <Link to="/admin/doctors" className={linkClass(p.startsWith("/admin/doctors") && !p.startsWith("/admin/doctors/pending"))}>
                      <span className="relative z-10">Doctors List</span>
                      {(p.startsWith("/admin/doctors") && !p.startsWith("/admin/doctors/pending")) && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl"></div>}
                    </Link>
                  </>
                );
              })()}
            </nav>

            {/* Enhanced User Actions */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Mobile Menu Button */}
              <button
                className="lg:hidden p-3 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-white/20"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Menu */}
          {mobileOpen && (
            <div className="lg:hidden bg-white/98 backdrop-blur-md border-t border-blue-200/50 py-6">
              <nav className="flex flex-col space-y-4 px-6">
                {[
                  { path: '/admin/dashboard', label: 'Dashboard' },
                  { path: '/admin/appointments', label: 'Appointments' },
                  { path: '/admin/add-doctor', label: 'Add Doctor' },
                  { path: '/admin/doctors', label: 'Doctors List' }
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      window.location.pathname === item.path
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600 hover:scale-105'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Logout Button */}
              <div className="flex flex-col space-y-3 px-6 mt-6 pt-6 border-t border-blue-200/50">
                <button
                  onClick={() => { localStorage.removeItem("token"); nav("/admin/login"); setMobileOpen(false); }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl text-center border-2 border-white/20"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="pt-16 px-6 page-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Add Doctor</h1>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
            <form onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input name="name" value={form.name} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-3" placeholder="Dr. John Doe" />

              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-1" placeholder="doctor@example.com" />
              {errors.email ? (<div className="text-red-600 text-xs mb-3">{errors.email}</div>) : (<div className="mb-3" />)}

              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input name="phone" inputMode="numeric" maxLength={10} value={form.phone} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-1" placeholder="XXXXXXXXXX" />
              {errors.phone ? (<div className="text-red-600 text-xs mb-3">{errors.phone}</div>) : (<div className="mb-3" />)}

              <label className="block text-sm font-medium text-slate-700 mb-1">Specializations</label>
              {(() => {
                const SPECIALTIES = Array.from(new Set([
                  "General Physician",
                  "Gynecologist",
                  "Dermatologist",
                  "Pediatrician",
                  "Neurologist",
                  "Cardiologist",
                  "Orthopedic Surgeon",
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
                ]));
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
                  <input name="fees" inputMode="numeric" value={form.fees} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-1" placeholder="e.g., 500" />
                  {errors.fees ? (<div className="text-red-600 text-xs mb-3">{errors.fees}</div>) : (<div className="mb-3" />)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slot Duration (mins)</label>
                  <select
                    name="slotDurationMins"
                    value={form.slotDurationMins}
                    onChange={onChange}
                    className="border border-slate-300 rounded-md p-2 w-full mb-1"
                  >
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                  </select>
                  {errors.slot ? (<div className="text-red-600 text-xs mb-3">{errors.slot}</div>) : (<div className="mb-3" />)}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                  <input name="experienceYears" inputMode="numeric" value={form.experienceYears} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full mb-1" placeholder="e.g., 5" />
                  {errors.exp ? (<div className="text-red-600 text-xs mb-3">{errors.exp}</div>) : (<div className="mb-3" />)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative mb-1">
                    <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={onChange} className="border border-slate-300 rounded-md p-2 w-full pr-10" placeholder="Set doctor password" />
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600">{showPass ? "🙈" : "👁"}</button>
                  </div>
                  {errors.password ? (<div className="text-red-600 text-xs mb-3">{errors.password}</div>) : (<div className="mb-3" />)}
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
        </div>
      </div>
    </div>
  );
}
