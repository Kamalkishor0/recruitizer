const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const API_BASE = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;

export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
