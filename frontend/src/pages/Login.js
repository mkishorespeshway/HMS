import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";


export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const nav = useNavigate();


  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      if (data?.user?.id) localStorage.setItem("userId", data.user.id);
      if (data?.user?.name) localStorage.setItem("userName", data.user.name);
      if (data?.user?.email) localStorage.setItem("userEmail", data.user.email);
      const role = data?.user?.role;
      if (role === "doctor") nav("/doctor/dashboard");
      else if (role === "admin") nav("/admin/dashboard");
      else nav("/");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };


return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
    <div className="max-w-md mx-auto pt-16">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">Welcome Back</h1>
        <p className="text-slate-600 mt-1">Log in to continue</p>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200 transition-shadow duration-200 hover:shadow-xl">
        <form onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            className="border border-slate-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            className="border border-slate-300 rounded-md p-2 w-full mb-4 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="group bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md w-full flex items-center justify-center gap-2">
            <span>Login</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>

      <div className="text-center mt-4">
        <a href="/register" className="text-indigo-700 hover:text-indigo-900">Create an account</a>
        <div className="mt-2">
          <a href="/forgot?role=patient" className="text-slate-700 hover:text-indigo-700">Forgot password?</a>
        </div>
      </div>
    </div>
  </div>
);
}