import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export type AdminTheme = 'default' | 'cyberwhite' | 'creamy' | 'forest' | 'ocean';

interface AdminStore {
  admin: AdminUser | null;
  token: string | null;
  globalSearchQuery: string;
  theme: AdminTheme;
  setAdmin: (admin: AdminUser, token: string) => void;
  setGlobalSearchQuery: (query: string) => void;
  setTheme: (theme: AdminTheme) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      globalSearchQuery: '',
      theme: 'default',
      setAdmin: (admin, token) => set({ admin, token }),
      setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
      setTheme: (theme) => set({ theme }),
      logout: () => set({ admin: null, token: null, globalSearchQuery: '' }),
    }),
    {
      name: 'gamebite-admin-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
