import { create } from 'zustand'

interface SMSStore {
  activeTab: string
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  searchQuery: string
  openAddDialog: string
  setActiveTab: (tab: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSearchQuery: (q: string) => void
  setOpenAddDialog: (d: string) => void
}

export const useSMSStore = create<SMSStore>((set) => ({
  activeTab: 'dashboard',
  sidebarOpen: false,
  sidebarCollapsed: false,
  searchQuery: '',
  openAddDialog: '',
  setActiveTab: (tab) => set({ activeTab: tab, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setOpenAddDialog: (d) => set({ openAddDialog: d }),
}))
