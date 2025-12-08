import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";


export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [show, setShow] = useState(false);
const nav = useNavigate();


  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      const userRole = data?.user?.role;
      localStorage.setItem("token", data.token);
      if (data?.user?.id) localStorage.setItem("userId", data.user.id);
      const uid = data?.user?.id;
      if (uid && data?.user?.name) localStorage.setItem(`userNameById_${uid}`, data.user.name);
      if (uid && data?.user?.email) localStorage.setItem(`userEmailById_${uid}`, data.user.email);
      if (userRole === "admin") {
        nav("/admin/dashboard");
      } else if (userRole === "doctor") {
        nav("/doctor/dashboard");
      } else {
        nav("/");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };


return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <div className="max-w-7xl mx-auto pt-8 px-4 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-slide-in-right px-4">Login to Your Account</h2>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl p-6 mb-8 animate-slide-in-left opacity-0 max-w-md mx-auto" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
        <div className="text-center mb-6">
          <p className="text-slate-600">Enter your credentials to log in</p>
        </div>
        <form onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
          <input
            className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105 mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
          <div className="relative mb-6">
            <input
              className="w-full p-3 border-2 border-slate-200 rounded-xl bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 hover:scale-105 pr-12"
              placeholder="Password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              onClick={() => setShow((v) => !v)}
              aria-label="Toggle password visibility"
            >
              👁️
            </button>
          </div>
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full">
            Login
          </button>
        </form>
        <div className="text-center mt-6">
          <a href="/register" className="text-indigo-700 hover:text-indigo-900">Create an account</a>
          <div className="mt-2">
            <a href="/forgot" className="text-slate-700 hover:text-indigo-700">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
