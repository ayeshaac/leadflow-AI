import "server-only";

const defaults = {
  OLLAMA_MODEL: "qwen2.5:3b",
  OLLAMA_BASE_URL: "http://localhost:11434",
} as const;

export function getServerEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    adminDashboardKey: process.env.ADMIN_DASHBOARD_KEY || "",
    ollamaModel: process.env.OLLAMA_MODEL || defaults.OLLAMA_MODEL,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || defaults.OLLAMA_BASE_URL,
  };
}

export function getMissingServerEnv() {
  const env = getServerEnv();
  return [
    ["NEXT_PUBLIC_SUPABASE_URL", env.supabaseUrl],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.supabaseAnonKey],
    ["SUPABASE_SERVICE_ROLE_KEY", env.serviceRoleKey],
    ["ADMIN_DASHBOARD_KEY", env.adminDashboardKey],
  ].filter(([, value]) => !value).map(([name]) => name);
}
