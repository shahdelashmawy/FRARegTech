import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (token: string, user: User) => {
        localStorage.setItem('fra_token', token);
        set({ token, user });
      },

      logout: () => {
        localStorage.removeItem('fra_token');
        localStorage.removeItem('fra_user');
        set({ token: null, user: null });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'fra_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
