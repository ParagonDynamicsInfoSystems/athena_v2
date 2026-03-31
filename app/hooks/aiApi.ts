import axios from "axios";

const aiApi = axios.create({
  baseURL: "https://sailwithcrm-athena.reportqube.com/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request interceptor — debug only
aiApi.interceptors.request.use((config) => {
  if (__DEV__) {
    console.log("AI API REQUEST:", config.method?.toUpperCase(), config.url);
  }
  return config;
});

// Response interceptor — debug only
aiApi.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("AI API RESPONSE:", response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      console.error("AI API ERROR:", error.response?.status, error.config?.url, error.message);
    }
    return Promise.reject(error);
  }
);

export default aiApi;
