
import axios from "axios";

const api = axios.create({
  baseURL: "https://erp.athena-logistics.com:8080/", // same as website
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 🔥 THIS IS IMPORTANT
api.interceptors.request.use((config) => {
  console.log("API REQUEST:", {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

export async function loginApi(username: string, password: string) {
  const response = await api.post(
    "/feeder/mobileApp/mobilelogin",
    {
      username,
      password,
    }
  );
  return response.data;
}
