// Standalone mode - no authentication required
export function useAuth() {
  return {
    user: { id: 1, name: "Admin", email: "admin@odontochin.com", role: "admin" },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}
