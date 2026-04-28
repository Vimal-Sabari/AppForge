import { create } from 'zustand'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: User, accessToken: string) => void
  clearUser: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setUser: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}))
