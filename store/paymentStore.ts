import { create } from 'zustand'

interface PaymentStore {
  lastPaymentStatus: string | null
  setLastPaymentStatus: (status: string | null) => void
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  lastPaymentStatus: null,
  setLastPaymentStatus: (status) => set({ lastPaymentStatus: status }),
}))
