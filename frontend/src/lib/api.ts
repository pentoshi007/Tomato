import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * Per-service API clients. Requests automatically carry the stored JWT;
 * an expired session clears state once and notifies the app via an event
 * instead of every caller handling 401s itself.
 */
export const UNAUTHORIZED_EVENT = "tomato:unauthorized";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function handleUnauthorized(error: AxiosError): Promise<never> {
  const hadToken = Boolean(error.config?.headers?.Authorization);
  if (error.response?.status === 401 && hadToken) {
    localStorage.removeItem("token");
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }
  return Promise.reject(error);
}

function attachAuthHeader(config: InternalAxiosRequestConfig) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

axios.interceptors.response.use((response) => response, handleUnauthorized);

function createServiceClient(baseUrl: string): AxiosInstance {
  const client = axios.create({ baseURL: baseUrl });
  client.interceptors.request.use(attachAuthHeader);
  client.interceptors.response.use((response) => response, handleUnauthorized);
  return client;
}

export const authApi = createServiceClient(
  import.meta.env.VITE_AUTH_SERVICE_URL,
);
export const restaurantApi = createServiceClient(
  import.meta.env.VITE_RESTAURANT_SERVICE_URL,
);
export const utilsApi = createServiceClient(
  import.meta.env.VITE_UTILS_SERVICE_URL,
);
export const riderApi = createServiceClient(
  import.meta.env.VITE_RIDER_SERVICE_URL,
);
export const adminApi = createServiceClient(
  import.meta.env.VITE_ADMIN_SERVICE_URL,
);

function firstString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const hit = value.find((entry) => typeof entry === "string" && entry.trim());
    return typeof hit === "string" ? hit : undefined;
  }
  return undefined;
}

/** Single error-message extractor for every toast/catch in the app. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (isRecord(data)) {
      const message = firstString(data.error) ?? firstString(data.message);
      if (message) return message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Check your connection and try again.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
