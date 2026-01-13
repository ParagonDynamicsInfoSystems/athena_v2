import axios from "axios";

const erpApi = axios.create({
  baseURL: "https://erp.athena-logistics.com:8080/",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Helper function to generate curl command
const generateCurlCommand = (config: any) => {
  const baseURL = config.baseURL || "";
  const url = config.url || "";
  let fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`;
  const method = (config.method || "GET").toUpperCase();
  
  // Add params to URL
  if (config.params) {
    const params = new URLSearchParams(config.params).toString();
    if (params) {
      fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${params}`;
    }
  }
  
  let curl = `curl -X ${method} "${fullUrl}"`;
  
  // Add headers
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== "content-length") {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    });
  }
  
  // Add data for POST/PUT/PATCH
  if (config.data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    const dataStr = typeof config.data === "string" 
      ? config.data 
      : JSON.stringify(config.data);
    curl += ` \\\n  -d '${dataStr}'`;
  }
  
  return curl;
};

// Request interceptor for logging
erpApi.interceptors.request.use((config) => {
  console.log("ERP API REQUEST:", {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

// Response interceptor for error handling
erpApi.interceptors.response.use(
  (response) => {
    console.log("ERP API RESPONSE:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    
    // Generate and print curl command
    const curlCommand = generateCurlCommand(config);
    console.error("=".repeat(80));
    console.error("ERP API ERROR - CURL COMMAND:");
    console.error(curlCommand);
    console.error("=".repeat(80));
    
    // Print error response
    console.error("ERP API ERROR RESPONSE:", {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
    });
    
    return Promise.reject(error);
  }
);

export default erpApi;

