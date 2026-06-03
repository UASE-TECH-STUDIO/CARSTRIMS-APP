import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

//  Request interceptor: attach token 
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

//  Response interceptor: handle errors + auto refresh on 401 
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status  = error.response?.status;
    const detail  = (error.response?.data?.detail || "").toString();
    const detailL = detail.toLowerCase();
    const origReq = error.config;

    //  Auto-refresh token on 401 
    if (status === 401 && !origReq._retry && typeof window !== "undefined") {
      const p = window.location.pathname;
      const publicPaths = ["/feed","/login","/register","/forgot-password","/cars/","/dealers/"];
      const isPublic = publicPaths.some(x => p.startsWith(x)) || p === "/";

      if (!isPublic) {
        // Try to refresh token
        try {
          const raw = localStorage.getItem("auth-storage");
          const parsed = raw ? JSON.parse(raw) : null;
          const refreshToken = parsed?.state?.user?.refreshToken;

          if (refreshToken && !isRefreshing) {
            isRefreshing = true;
            origReq._retry = true;

            const refreshRes = await axios.post(
              `${API_BASE}/api/v1/auth/refresh`,
              { refreshToken },
              { headers: { "Content-Type": "application/json" } }
            );

            const newToken = refreshRes.data?.accessToken;
            if (newToken) {
              // Update stored token
              const updated = JSON.parse(localStorage.getItem("auth-storage") || "{}");
              if (updated?.state?.user) {
                updated.state.user.accessToken = newToken;
                if (refreshRes.data?.refreshToken) {
                  updated.state.user.refreshToken = refreshRes.data.refreshToken;
                }
                localStorage.setItem("auth-storage", JSON.stringify(updated));
              }
              // Retry all queued requests
              refreshQueue.forEach(cb => cb(newToken));
              refreshQueue = [];
              isRefreshing = false;
              origReq.headers.Authorization = "Bearer " + newToken;
              return api(origReq);
            }
          } else if (isRefreshing) {
            // Wait for refresh to complete
            return new Promise(resolve => {
              refreshQueue.push((token: string) => {
                origReq.headers.Authorization = "Bearer " + token;
                resolve(api(origReq));
              });
            });
          }
        } catch (_) {
          isRefreshing = false;
          refreshQueue = [];
        }

        // Refresh failed - redirect to login
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    //  Error messages 
    if (!error.response) {
      error.userMessage = "Unable to connect to server. Please check your connection.";
      error.isNetworkError = true;
    } else {
      if (status === 400 && detailL.includes("already registered")) {
        error.userMessage = "An account with this email already exists. Please sign in instead.";
      } else if (status === 400 && detailL.includes("already in favorites")) {
        error.userMessage = "This car is already in your favorites.";
      } else if (status === 400 && detailL.includes("already exists")) {
        error.userMessage = detail;
      } else if (status === 401) {
        error.userMessage = detail || "Session expired. Please log in again.";
      } else if (status === 403) {
        error.userMessage = "You do not have permission to do this.";
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
