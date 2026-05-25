import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  companies: Company[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  activeCompany: Company | null;
  setAuth: (token: string, user: User) => void;
  setActiveCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeCompany: null,
      setAuth: (token, user) => set({ token, user }),
      setActiveCompany: (company) => set({ activeCompany: company }),
      logout: () => set({ token: null, user: null, activeCompany: null }),
    }),
    { name: 'auth' }, // localStorage key
  ),
);
