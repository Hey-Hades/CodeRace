import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  profile: null,
  isAuthLoading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthLoading: (isLoading) => set({ isAuthLoading: isLoading }),

  clearUser: () => set({ user: null, profile: null }),
}));
