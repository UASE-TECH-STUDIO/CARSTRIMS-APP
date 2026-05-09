import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      // ✅ MUST MATCH ZUSTAND STORE NAME
      const raw = localStorage.getItem("car-dealer-auth");

      if (raw) {
        const parsed = JSON.parse(raw);

        // ✅ correct persisted structure
        const token = parsed?.state?.user?.accessToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error("Token parse error:", err);
    }
  }

  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;

        const isPublic = [
          "/",
          "/feed",
          "/auth/login",
          "/auth/register",
          "/auth/forgot-password",
        ].some((p) => path.startsWith(p));

        if (!isPublic) {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };