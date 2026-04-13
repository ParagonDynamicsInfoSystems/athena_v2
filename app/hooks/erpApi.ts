import axios from "axios";

const erpApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_ERP_API_URL || "https://erp.athena-logistics.com:8080/",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request interceptor — debug only
erpApi.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log("ERP API REQUEST:", config.method?.toUpperCase(), config.url);
  }
  return config;
});

// Response interceptor — debug only
erpApi.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("ERP API RESPONSE:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error("ERP API ERROR:", error.response?.status, error.config?.url, error.message);
    }
    return Promise.reject(error);
  }
);

export default erpApi;
