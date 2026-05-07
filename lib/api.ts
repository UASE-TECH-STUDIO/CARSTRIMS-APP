import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://carstrims-backend.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      typeof window !== "undefined"
    ) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);

        // Update Zustand store
        const { useAuthStore } = await import("@/store/authStore");
        const state = useAuthStore.getState();
        if (state.user) {
          useAuthStore.setState({
            user: { ...state.user, accessToken, refreshToken: newRefresh },
          });
        }

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

