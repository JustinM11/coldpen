const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(method, path, { body, getToken } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      // If token fails, continue without authentication
      console.warn("Failed to get auth token:", error);
    }
  }

  const config = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (response.status === 204) {
    return null; // No content
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong");
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, opts) => request("POST", path, opts),
  patch: (path, opts) => request("PATCH", path, opts),
  delete: (path, opts) => request("DELETE", path, opts),
};
