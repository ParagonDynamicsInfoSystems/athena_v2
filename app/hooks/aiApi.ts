import axios from "axios";

const aiApi = axios.create({
  baseURL: "https://sailwithcrm-athena.reportqube.com/api",
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
aiApi.interceptors.request.use((config) => {
  console.log("AI API REQUEST:", {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

// Response interceptor for error handling
aiApi.interceptors.response.use(
  (response) => {
    console.log("AI API RESPONSE:", {
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
    console.error("AI API ERROR - CURL COMMAND:");
    console.error(curlCommand);
    console.error("=".repeat(80));
    
    // Print error response
    console.error("AI API ERROR RESPONSE:", {
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

export default aiApi;

