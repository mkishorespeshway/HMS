import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function DoctorLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (data?.user?.role !== "doctor") {
        setError("Only doctors can login here");
      } else {
        localStorage.setItem("token", data.token);
        if (data?.user?.id) localStorage.setItem("userId", data.user.id);
        try {
          const uid = String(data?.user?.id || "");
          if (uid) localStorage.setItem('userId', uid);
        } catch (_) {}
        nav("/doctor/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-indigo-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="#0EA5E9"/>
              <path d="M12 7v10M7 12h10" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span className="text-lg font-semibold">HospoZen</span>
          </Link>
          <nav className="flex items-center gap-6 text-slate-700">
            <Link to="/" className="hover:text-indigo-600">Home</Link>
            <Link to="/admin/login" className="hover:text-indigo-600">Admin</Link>
          </nav>
        </div>
      </header>
      <div className="flex items-start justify-center pt-24">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
            <div className="text-center text-indigo-700 font-semibold mb-4">Doctor Login</div>
            <form onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                className="border border-slate-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  className="border border-slate-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  placeholder="Password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  onClick={() => setShow((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  👁️
                </button>
              </div>
              {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-10 rounded-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-3 text-sm text-slate-700">
              Admin Login? <Link to="/admin/login" className="text-indigo-600 hover:text-indigo-800">Click here</Link>
              <div className="mt-2">
                <Link to="/forgot?role=doctor" className="text-slate-700 hover:text-indigo-700">Forgot password?</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
