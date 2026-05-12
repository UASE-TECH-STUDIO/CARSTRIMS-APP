import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.user?.accessToken;
        if (token) config.headers.Authorization = "Bearer " + token;
      }
    } catch (_) {}
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (!error.response) {
      error.userMessage = "Unable to connect to server. Please check your connection.";
      error.isNetworkError = true;
    } else {
      const status = error.response.status;
      const detail = (error.response.data?.detail || "").toString();
      const detailLow = detail.toLowerCase();

      if (status === 400 && detailLow.includes("already registered")) {
        error.userMessage = "An account with this email already exists. Please sign in instead.";
      } else if (status === 400 && detailLow.includes("already in favorites")) {
        error.userMessage = "This car is already in your favorites.";
      } else if (status === 400 && detailLow.includes("already exists")) {
        error.userMessage = detail;
      } else if (status === 401) {
        // Check if this is a "pending approval" block from the backend
        if (detailLow.includes("pending") || detailLow.includes("approval") || detailLow.includes("awaiting")) {
          error.userMessage = "PENDING_APPROVAL";
          error.isPendingApproval = true;
        } else {
          error.userMessage = "Your session has expired. Please sign in again.";
          if (typeof window !== "undefined") {
            const p = window.location.pathname;
            const pub = ["/feed", "/login", "/register", "/forgot-password", "/cars/", "/dealers/"];
            if (!pub.some((x) => p.startsWith(x)) && p !== "/") {
              window.location.href = "/login";
            }
          }
        }
      } else if (status === 403) {
        // 403 can also mean pending approval
        if (detailLow.includes("pending") || detailLow.includes("approval") || detailLow.includes("awaiting") || detailLow.includes("not approved")) {
          error.userMessage = "PENDING_APPROVAL";
          error.isPendingApproval = true;
        } else {
          error.userMessage = "You do not have permission to do this.";
        }
      } else if (status === 404) {
        error.userMessage = detail || "The requested item was not found.";
      } else if (status === 422) {
        error.userMessage = "Some fields are missing or invalid. Please check your input.";
      } else if (status >= 500) {
        error.userMessage = "Server error. Please try again in a moment.";
      } else {
        error.userMessage = detail || "Something went wrong. Please try again.";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };
