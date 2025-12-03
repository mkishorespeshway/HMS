export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-7xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-semibold text-slate-900">About Us</h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          We make it simple to find trusted doctors and book appointments online.
          Browse specialties, view profiles, and connect with experts when you need them.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-semibold text-indigo-700">10k+</div>
            <div className="text-slate-700 mt-1">Appointments booked</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-semibold text-indigo-700">2k+</div>
            <div className="text-slate-700 mt-1">Verified doctors</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-semibold text-indigo-700">50+</div>
            <div className="text-slate-700 mt-1">Specialties</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="bg-indigo-600/90 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-semibold">Why Choose Us</h2>
              <ul className="mt-4 space-y-3 text-indigo-100">
                <li>Verified doctor profiles</li>
                <li>Easy online booking</li>
                <li>Secure video consultations</li>
                <li>E‑prescriptions and records</li>
              </ul>
            </div>
          </div>
          <div className="hidden md:block">
            <img
              src={(process.env.PUBLIC_URL || "") + "/doctor1.jpeg"}
              alt="Team"
              className="rounded-2xl shadow-md"
              onError={(e) => { e.currentTarget.src = "https://raw.githubusercontent.com/abhi051002/hms-fullstack/main/frontend/src/readme_images/about.png"; }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
