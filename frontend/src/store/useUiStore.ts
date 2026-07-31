import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isMenuIconCross: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isProfileDrawerOpen: boolean;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
}

let animationTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set, get) => ({
  isSidebarOpen: false,
  isMenuIconCross: false,

  toggleSidebar: () => {
    const { isSidebarOpen } = get();
    if (animationTimer) clearTimeout(animationTimer);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (isMobile) {
      if (!isSidebarOpen) {
        // OPENING SEQUENCE ON MOBILE:
        // 1. Morph icon to Cross (X) first
        set({ isMenuIconCross: true });
        // 2. Open sidebar AFTER animation finishes (280ms)
        animationTimer = setTimeout(() => {
          set({ isSidebarOpen: true });
        }, 280);
      } else {
        // CLOSING SEQUENCE ON MOBILE:
        // 1. Morph icon back to Hamburger first
        set({ isMenuIconCross: false });
        // 2. Close sidebar AFTER animation finishes (280ms)
        animationTimer = setTimeout(() => {
          set({ isSidebarOpen: false });
        }, 280);
      }
    } else {
      // Desktop: toggle immediately
      const nextState = !isSidebarOpen;
      set({ isSidebarOpen: nextState, isMenuIconCross: nextState });
    }
  },

  closeSidebar: () => {
    const { isSidebarOpen } = get();
    if (!isSidebarOpen) return;
    if (animationTimer) clearTimeout(animationTimer);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    if (isMobile) {
      // CLOSING SEQUENCE ON MOBILE:
      // 1. Morph icon back to Hamburger first
      set({ isMenuIconCross: false });
      // 2. Close sidebar AFTER animation finishes (280ms)
      animationTimer = setTimeout(() => {
        set({ isSidebarOpen: false });
      }, 280);
    } else {
      set({ isSidebarOpen: false, isMenuIconCross: false });
    }
  },

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen, isMenuIconCross: isOpen }),
  isProfileDrawerOpen: false,
  openProfileDrawer: () => set({ isProfileDrawerOpen: true }),
  closeProfileDrawer: () => set({ isProfileDrawerOpen: false }),
}));
