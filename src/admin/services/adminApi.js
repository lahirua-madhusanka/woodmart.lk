import apiClient from "../../services/apiClient";

export async function safeRequest(request, fallback) {
  try {
    const response = await request();
    return response?.data ?? response;
  } catch {
    if (typeof fallback === "function") {
      return fallback();
    }
    return fallback;
  }
}

export function get(path, options = {}) {
  return apiClient.get(path, options);
}

export function post(path, payload) {
  return apiClient.post(path, payload);
}

export function put(path, payload) {
  return apiClient.put(path, payload);
}

export function del(path, payload) {
  if (payload) {
    return apiClient.delete(path, { data: payload });
  }
  return apiClient.delete(path);
}
