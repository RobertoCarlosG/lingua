import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectUiLanguage, type UiLanguage } from '@/lib/i18n'
import type { Language } from '@/types/database'

interface AppState {
  activeLanguage: Language
  setActiveLanguage: (lang: Language) => void
  uiLanguage: UiLanguage
  setUiLanguage: (lang: UiLanguage) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  userId: string | null
  setUserId: (id: string | null) => void
  speechRate: 0.85 | 1
  setSpeechRate: (rate: 0.85 | 1) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      activeLanguage: 'en',
      setActiveLanguage: (lang) => set({ activeLanguage: lang }),
      uiLanguage: detectUiLanguage(),
      setUiLanguage: (lang) => set({ uiLanguage: lang }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      userId: null,
      setUserId: (id) => set({ userId: id }),
      speechRate: 0.85,
      setSpeechRate: (rate) => set({ speechRate: rate }),
    }),
    {
      name: 'lingua-store',
      partialize: (state) => ({
        activeLanguage: state.activeLanguage,
        uiLanguage: state.uiLanguage,
        sidebarOpen: state.sidebarOpen,
        speechRate: state.speechRate,
      }),
    }
  )
)
