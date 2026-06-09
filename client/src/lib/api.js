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

  // `redirect: "manual"` so an auth redirect doesn't get silently followed to
  // the SPA's HTML shell (which would parse as null and look like a generic
  // failure). A protected route with no valid session makes Clerk's
  // requireAuth() respond with a 3xx redirect to sign-in.
  const response = await fetch(`${BASE_URL}${path}`, { ...config, redirect: "manual" });

  // An opaque redirect (or any 3xx) on an API call means we're not
  // authenticated — surface it as a clean 401 instead of a confusing parse error.
  if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
    const error = new Error("Your session has expired. Please sign in again.");
    error.status = 401;
    error.code = "UNAUTHENTICATED";
    throw error;
  }

  if (response.status === 204) {
    return null; // No content
  }

  // Tolerate non-JSON bodies (e.g. a proxy 5xx HTML page) instead of throwing
  // an opaque SyntaxError that masks the real status.
  let data = {};
  try {
    data = await response.json();
  } catch {
    if (response.ok) return null;
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
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
