import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: User, accessToken?: string | null) => void
  clearUser: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user, accessToken = null) => set({ user, accessToken, isAuthenticated: true }),
      clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'appforge-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
