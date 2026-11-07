
const SESSION_KEY = "msoa-shop-session";

export async function apiRequest(baseUrl, path, options = {}) {
  let token = null;

  try {
    const session = JSON.parse(
      localStorage.getItem(SESSION_KEY)
    );
    token = session?.token ?? null;
  } catch {
    // No active session
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // No JSON error body
    }

    const exception = new Error(message);
    exception.status = response.status;
    throw exception;
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
