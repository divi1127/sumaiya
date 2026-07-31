import axios from 'axios';

const API = axios.create({
  baseURL: "https://sumaiya-vbiu.onrender.com/api",

  headers: { 
    'Content-Type': 'application/json',
  },

  withCredentials: false,
});


API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aura_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Response Interceptor (FIXED)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("aura_token");
      localStorage.removeItem("aura_user");
      console.warn("🔒 Token expired or invalid - Session Cleared");
      
      // Redirect to login only if we are NOT already on login/register pages
      const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthPage) {
        window.location.href = '/login?expired=true';
      }
    }

    // ❗ IMPORTANT: return FULL error object
    return Promise.reject(error);
  }
);

export const getActiveOffers = async () => {
  return await API.get("/offers/active");
};

export const resolveImage = (path) => {
  if (!path) return "";
  
  const baseUrl = "https://sumaiya-vbiu.onrender.com";

  // Replace any old backend URLs with the current one
  if (path.startsWith("http")) {
    if (
      path.includes("localhost:5000") ||
      path.includes("ecommerce-73js.onrender.com") ||
      path.includes("ecommerce-eight-virid-50.vercel.app")
    ) {
      return path
        .replace(/https?:\/\/localhost:5000/, baseUrl)
        .replace(/https?:\/\/ecommerce-73js\.onrender\.com/, baseUrl)
        .replace(/https?:\/\/ecommerce-eight-virid-50\.vercel\.app/, baseUrl);
    }
    return path;
  }
  
  if (path.startsWith("/")) return `${baseUrl}${path}`;
  
  return `${baseUrl}/${path}`;
};

export default API;