import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type ResponseEntry = {
  response: string
  notes?: string
}

type GuestAssessmentState = {
  guestSessionId: string | null
  childName: string | null
  dateOfBirth: string | null
  ageMonths: number | null
  disease: string | null
  responses: Record<string, ResponseEntry>
  currentStep: number
}

type GuestAssessmentActions = {
  initializeSession: () => void
  setChildInfo: (name: string, dateOfBirth: string, age: number, disease: string) => void
  setResponse: (milestoneId: string, response: string, notes?: string) => void
  setStep: (step: number) => void
  reset: () => void
  getSessionData: () => GuestAssessmentState
}

type GuestAssessmentStore = GuestAssessmentState & GuestAssessmentActions

const initialState: GuestAssessmentState = {
  guestSessionId: null,
  childName: null,
  dateOfBirth: null,
  ageMonths: null,
  disease: null,
  responses: {},
  currentStep: 0,
}

const storage = createJSONStorage<GuestAssessmentStore>(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      get length() {
        return 0
      },
    } as Storage
  }
  return window.localStorage
}) as any

export const useGuestAssessmentStore = create<GuestAssessmentStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      initializeSession: () => {
        set({
          guestSessionId: crypto.randomUUID(),
        })
      },
      setChildInfo: (name, dateOfBirth, age, disease) => {
        set({
          childName: name,
          dateOfBirth,
          ageMonths: age,
          disease,
        })
      },
      setResponse: (milestoneId, response, notes) => {
        set((state) => ({
          responses: {
            ...state.responses,
            [milestoneId]: notes ? { response, notes } : { response },
          },
        }))
      },
      setStep: (step) => {
        set({
          currentStep: step,
        })
      },
      reset: () => {
        set({ ...initialState })
      },
      getSessionData: () => {
        const {
          guestSessionId,
          childName,
          dateOfBirth,
          ageMonths,
          disease,
          responses,
          currentStep,
        } = get()
        return {
          guestSessionId,
          childName,
          dateOfBirth,
          ageMonths,
          disease,
          responses,
          currentStep,
        }
      },
    }),
    {
      name: 'guest-assessment-storage',
      storage,
      partialize: (state) => ({
        guestSessionId: state.guestSessionId,
        childName: state.childName,
        dateOfBirth: state.dateOfBirth,
        ageMonths: state.ageMonths,
        disease: state.disease,
        responses: state.responses,
        currentStep: state.currentStep,
      }),
    }
  )
)

