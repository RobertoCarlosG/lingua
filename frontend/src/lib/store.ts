import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/types/database'

interface AppState {
  activeLanguage: Language
  setActiveLanguage: (lang: Language) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  userId: string | null
  setUserId: (id: string | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeLanguage: 'en',
      setActiveLanguage: (lang) => set({ activeLanguage: lang }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      userId: null,
      setUserId: (id) => set({ userId: id }),
    }),
    {
      name: 'lingua-store',
      partialize: (state) => ({
        activeLanguage: state.activeLanguage,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
