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
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
    <div className="max-w-md mx-auto pt-16">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">Create Account</h1>
      </div>
      <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200 transition-shadow duration-200 hover:shadow-xl">
        <form onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            className="border border-slate-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="border border-slate-300 rounded-md p-2 w-full mb-1 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email ? (<div className="text-red-600 text-xs mb-3">{errors.email}</div>) : (<div className="mb-3" />)}
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <div className="relative mb-1">
            <input
              className="border border-slate-300 rounded-md p-2 w-full focus:outline-none focus:ring-4 focus:ring-indigo-100 pr-10"
              placeholder="Password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600">
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password ? (<div className="text-red-600 text-xs mb-3">{errors.password}</div>) : (<div className="mb-3" />)}
          <label className="block text-sm font-medium text-slate-700 mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            className="border border-slate-300 rounded-md p-2 w-full mb-3"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (!file) { setPhotoBase64(""); return; }
              const reader = new FileReader();
              reader.onloadend = () => setPhotoBase64(String(reader.result || ""));
              reader.readAsDataURL(file);
            }}
          />
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <input
            className="border border-slate-300 rounded-md p-2 w-full mb-1 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Phone Number"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(v);
            }}
          />
          {errors.phone ? (<div className="text-red-600 text-xs mb-3">{errors.phone}</div>) : (<div className="mb-3" />)}
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <textarea
            rows={3}
            className="border border-slate-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                className="border border-slate-300 rounded-md p-2 w-full mb-3"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                className="border border-slate-300 rounded-md p-2 w-full mb-1 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
              />
              {errors.age ? (<div className="text-red-600 text-xs mb-3">{errors.age}</div>) : (<div className="mb-3" />)}
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          {(() => {
            const t = new Date();
            const yyyy = t.getFullYear();
            const mm = String(t.getMonth() + 1).padStart(2, "0");
            const dd = String(t.getDate()).padStart(2, "0");
            const maxDate = `${yyyy}-${mm}-${dd}`;
            return (
              <>
                <input
                  type="date"
                  max={maxDate}
                  className="border border-slate-300 rounded-md p-2 w-full mb-1 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  value={dob}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDob(v);
                  }}
                />
                {errors.dob ? (<div className="text-red-600 text-xs mb-3">{errors.dob}</div>) : (<div className="mb-3" />)}
              </>
            );
          })()}
          <input type="hidden" value={role} readOnly />
          <div className="mb-4 text-sm text-slate-600">Creating a patient account</div>
          <button className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md flex items-center justify-center gap-2">
            <span>Register</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>
      <div className="text-center mt-4">
        <a href="/login" className="text-indigo-700 hover:text-indigo-900">Already have an account? Login</a>
      </div>
    </div>
  </div>
);
}
