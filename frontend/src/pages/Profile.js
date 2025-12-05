import { useEffect, useState } from "react";
 
import API from "../api";

export default function Profile() {
  const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop";
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [age, setAge] = useState("");
  const ageFromBirthday = (d) => {
    if (!d) return "--";
    const b = new Date(d);
    if (Number.isNaN(b.getTime())) return "--";
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return String(age);
  };

  useEffect(() => {
    const tryGetUid = () => {
      const direct = localStorage.getItem("userId");
      if (direct) return direct;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || "";
          if (key.startsWith("userNameById_")) return key.replace("userNameById_", "");
          if (key.startsWith("userEmailById_")) return key.replace("userEmailById_", "");
          if (key.startsWith("userPhoneById_")) return key.replace("userPhoneById_", "");
        }
      } catch (_) {}
      return null;
    };

    const uid = tryGetUid();
    const n = uid ? localStorage.getItem(`userNameById_${uid}`) : null;
    const e = uid ? localStorage.getItem(`userEmailById_${uid}`) : null;
    const p = uid ? localStorage.getItem(`userPhoneById_${uid}`) : null;
    const p2 = uid ? localStorage.getItem(`userMobileById_${uid}`) : null;
    const a = uid ? localStorage.getItem(`userAddressById_${uid}`) : null;
    const g = uid ? localStorage.getItem(`userGenderById_${uid}`) : null;
    const b1 = uid ? localStorage.getItem(`userBirthdayById_${uid}`) : null;
    const b2 = uid ? localStorage.getItem(`userDobById_${uid}`) : null;
    const ag = uid ? localStorage.getItem(`userAgeById_${uid}`) : null;
    const byId = uid ? localStorage.getItem(`userPhotoBase64ById_${uid}`) : null;

    setName(n || "");
    setEmail(e || "");
    setPhone(p || p2 || "");
    setAddress(a || "");
    setGender(g || "");
    const dobVal = b1 || b2 || "";
    setBirthday(dobVal);
    setAge(ag || "");
    setPhoto(byId || "");

    (async () => {
      try {
        const { data } = await API.get('/auth/me');
        if (data) {
          if (data.name) setName(String(data.name));
          if (data.email) setEmail(String(data.email));
          const ph = String(data.phone || data.mobile || data.contactNumber || data.phoneNumber || data?.user?.phone || data?.user?.mobile || data?.user?.contactNumber || "");
          if (ph) setPhone(ph);
          if (data.address) setAddress(String(data.address));
          if (data.gender) setGender(String(data.gender));
          if (data.birthday) {
            const d = String(data.birthday);
            setBirthday(d);
            setAge(ageFromBirthday(d));
          }
          if (String(data.photoBase64 || '').startsWith('data:image')) setPhoto(String(data.photoBase64));
        }
      } catch (_) {}
    })();
  }, []);

  const save = async () => {
    try {
      if (email && !String(email).includes('@')) { alert('Please enter a valid email containing @'); return; }
      if (phone && String(phone).replace(/\D/g, '').length !== 10) { alert('Phone number must be 10 digits'); return; }
      await API.put('/auth/me', { name, email, phone, address, gender, birthday, photoBase64: photo });
      const uid = localStorage.getItem("userId");
      if (uid) {
        localStorage.setItem(`userNameById_${uid}`, name || "");
        localStorage.setItem(`userEmailById_${uid}`, email || "");
        localStorage.setItem(`userPhoneById_${uid}`, phone || "");
        localStorage.setItem(`userMobileById_${uid}`, phone || "");
        localStorage.setItem(`userAddressById_${uid}`, address || "");
        localStorage.setItem(`userGenderById_${uid}`, gender || "");
        localStorage.setItem(`userBirthdayById_${uid}`, birthday || "");
        localStorage.setItem(`userDobById_${uid}`, birthday || "");
        localStorage.setItem(`userAgeById_${uid}`, ageFromBirthday(birthday) || age || "");
        localStorage.setItem(`userPhotoBase64ById_${uid}`, photo || "");
      }
      setEditing(false);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to save');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto pt-8 px-4 animate-fade-in">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-slide-in-right">Your Profile</h2>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-8 mb-8 animate-slide-in-left opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500">
                {String(photo || "").startsWith("data:image") ? (
                  <img
                    src={photo}
                    alt="User"
                    className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl border-2 border-indigo-200 mx-auto hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto hover:scale-110 transition-transform duration-700">
                    <div className="text-6xl text-slate-400">👤</div>
                  </div>
                )}
                <div className="text-center mt-4">
                  <div className="text-2xl font-bold text-slate-800">{name}</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500">
                <div className="text-xl font-bold text-slate-800 mb-4">Contact Information</div>
                {!editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div> Email: <a className="text-indigo-600 hover:text-indigo-700 font-medium" href={`mailto:${email}`}>{email}</a></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div> Phone: <span className="text-slate-700 font-medium">{phone}</span></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-indigo-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div> Address: <div className="whitespace-pre-wrap text-slate-700 font-medium">{address}</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Image</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setPhoto(String(reader.result || ""));
                        reader.readAsDataURL(file);
                      }} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                      <input inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(String(e.target.value).replace(/\D/g, "").slice(0, 10))} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500">
                  <div className="text-xl font-bold text-slate-800 mb-4">Basic Information</div>
                  {!editing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div> Gender: <span className="text-slate-700 font-medium">{gender}</span></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m0 0l-2-2m2 2l2-2m6-6v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2h8a2 2 0 012 2z" />
                        </svg>
                        <div> Birthday: <span className="text-slate-700 font-medium">{birthday}</span></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div> Age: <span className="text-slate-700 font-medium">{age}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105">
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Birthday</label>
                        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                        <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 animate-fade-in flex gap-4" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={save} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
