import { useEffect, useState } from "react";
import API from "../api";

export default function About() {
  const [stats, setStats] = useState({ appointments: 0, doctors: 0, specialties: 0 });
  const [specs, setSpecs] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await API.get('/stats');
        if (alive) setStats({
          appointments: Number(data?.appointments || 0),
          doctors: Number(data?.doctors || 0),
          specialties: Number(data?.specialties || 0)
        });
      } catch (_) {}
      try {
        const { data } = await API.get('/doctors');
        const list = Array.isArray(data) ? data : [];
        const dcount = list.length;
        const uniq = new Set();
        list.forEach((d) => {
          const arr = Array.isArray(d?.specializations) ? d.specializations : [];
          arr.forEach((s) => { const x = String(s || '').trim(); if (x) uniq.add(x); });
        });
        const names = Array.from(uniq).sort((a, b) => String(a).localeCompare(String(b)));
        if (alive) {
          setStats((prev) => ({
            appointments: prev.appointments,
            doctors: Math.max(prev.doctors, dcount),
            specialties: Math.max(prev.specialties, uniq.size)
          }));
          setSpecs(names);
        }
      } catch (_) {}
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="page-gradient">
      <section className="max-w-7xl mx-auto px-4 pt-10 animate-fade-in">
        <h1 className="text-3xl font-semibold text-slate-900 animate-slide-in-left">About Us</h1>
        <p className="mt-2 text-slate-600 max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          We make it simple to find trusted doctors and book appointments online.
          Browse specialties, view profiles, and connect with experts when you need them.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-8 animate-fade-in">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="text-2xl font-semibold text-indigo-700">{stats.appointments}+</div>
            <div className="text-slate-700 mt-1">Appointments booked</div>
          </div>
          <div className="glass-card p-6">
            <div className="text-2xl font-semibold text-indigo-700">{stats.doctors}+</div>
            <div className="text-slate-700 mt-1">Verified doctors</div>
          </div>
          <div className="glass-card p-6">
            <div className="text-2xl font-semibold text-indigo-700">{stats.specialties}+</div>
            <div className="text-slate-700 mt-1">Specialties</div>
          </div>
        </div>
      </section>

      

      <section className="max-w-7xl mx-auto px-4 mt-10 pb-16 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="bg-indigo-600/90 rounded-2xl p-8 text-white card-hover">
              <h2 className="text-2xl font-semibold">Why Choose Us</h2>
              <ul className="mt-4 space-y-3 text-indigo-100">
                <li>Verified doctor profiles</li>
                <li>Easy online booking</li>
                <li>Secure video consultations</li>
                <li>E‑prescriptions and records</li>
              </ul>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
