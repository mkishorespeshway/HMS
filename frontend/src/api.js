import axios from "axios";

<<<<<<< HEAD
const API = axios.create({ baseURL: (process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_BASE_URL_PRODUCTION : process.env.REACT_APP_API_BASE_URL_LOCAL) + '/api' });
=======
function toApiBase(originLike) {
  const o = String(originLike || "").trim().replace(/\/$/, "");
  if (!o) return "http://localhost:5000/api";
  return o.endsWith("/api") ? o : (o + "/api");
}

const configured = process.env.REACT_APP_API_BASE_URL && String(process.env.REACT_APP_API_BASE_URL).trim();
const inferred = (typeof window !== "undefined") ? String(window.location.origin).replace(/\/$/, "") : "http://localhost:5000";
const base = toApiBase(configured || inferred);
const API = axios.create({ baseURL: base });
>>>>>>> 8e159f7edbdd15307b7b6ffdd06f9b079bf5db86
API.defaults.timeout = 8000;

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
