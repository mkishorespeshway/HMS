import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const role = "patient";
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const today = new Date();
    const calcAge = (d) => {
      if (!d) return "";
      const b = new Date(d);
      if (Number.isNaN(b.getTime())) return "";
      let a = today.getFullYear() - b.getFullYear();
      const m = today.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
      return String(a);
    };
    const errs = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    const phoneSan = String(phone || "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneSan)) errs.phone = "Phone must start 6-9 and be 10 digits";
    const passOk = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/.test(String(password || ""));
    if (!passOk) errs.password = "Password 6-12 chars, letters & numbers";
    if (age === "" || Number.isNaN(Number(age))) errs.age = "Enter numeric age";
    if (dob) {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) errs.dob = "Enter a valid date";
      else if (d > today) errs.dob = "Date cannot be in future";
      const expected = calcAge(dob);
      if (expected !== "" && String(expected) !== String(age)) errs.age = "Age must match date of birth";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password: password || "password123",
        role,
      });

      localStorage.setItem("token", res.data.token);
      if (res.data?.user?.id) localStorage.setItem("userId", res.data.user.id);
      const uid = res.data?.user?.id;
      if (uid && res.data?.user?.name) localStorage.setItem(`userNameById_${uid}`, res.data.user.name);
      if (uid && res.data?.user?.email) localStorage.setItem(`userEmailById_${uid}`, res.data.user.email);
      if (uid && photoBase64) localStorage.setItem(`userPhotoBase64ById_${uid}`, photoBase64);
      if (uid && phone) localStorage.setItem(`userPhoneById_${uid}`, phone);
      if (uid && address) localStorage.setItem(`userAddressById_${uid}`, address);
      if (uid && gender) localStorage.setItem(`userGenderById_${uid}`, gender);
      if (uid && age) localStorage.setItem(`userAgeById_${uid}`, age);
      if (uid && dob) localStorage.setItem(`userDobById_${uid}`, dob);
      nav("/search");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
    <div className="max-w-7xl mx-auto px-4 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-slide-in-right px-4">Create Your Account</h2>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 animate-slide-in-left opacity-0 max-w-lg mx-auto" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <div className="text-center mb-6">
          <p className="text-slate-600 text-lg font-medium italic bg-slate-50 rounded-lg p-3 border border-slate-200">Fill in your details to create an account</p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="text-indigo-600">👤</span>
              Personal Information
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105 pr-12"
                    placeholder="Password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-700">
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
                {errors.password && <div className="text-red-600 text-xs mt-1">{errors.password}</div>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="text-indigo-600">📞</span>
              Contact Details
            </h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <input
                  className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                  placeholder="Phone Number"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(v);
                  }}
                />
                {errors.phone && <div className="text-red-600 text-xs mt-1">{errors.phone}</div>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="text-indigo-600">📋</span>
              Personal Details
            </h3>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <select
                    className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105 no-spin"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                  {errors.age && <div className="text-red-600 text-xs mt-1">{errors.age}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                {(() => {
                  const t = new Date();
                  const yyyy = t.getFullYear();
                  const mm = String(t.getMonth() + 1).padStart(2, "0");
                  const dd = String(t.getDate()).padStart(2, "0");
                  const maxDate = `${yyyy}-${mm}-${dd}`;
                  return (
                    <input
                      type="date"
                      max={maxDate}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                      value={dob}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDob(v);
                      }}
                    />
                  );
                })()}
                {errors.dob && <div className="text-red-600 text-xs mt-1">{errors.dob}</div>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="text-indigo-600">📸</span>
              Profile Picture
            </h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) { setPhotoBase64(""); return; }
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoBase64(String(reader.result || ""));
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

          <input type="hidden" value={role} readOnly />
          <div className="text-center text-sm text-slate-600 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-2 border border-indigo-100 font-medium">
            Creating a patient account
          </div>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full text-base">
            Create Account
          </button>
          <div className="text-center mt-3 pt-2 border-t border-slate-200">
            <a href="/login" className="text-indigo-700 hover:text-indigo-900 font-medium">Already have an account? Login</a>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}
