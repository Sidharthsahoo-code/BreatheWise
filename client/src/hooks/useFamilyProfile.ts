import { useApp } from "@/context/AppContext"

export function useFamilyProfile() {
  const { profile, setProfile } = useApp()
  return { profile, setProfile, hasProfile: profile.members.length > 0 }
}