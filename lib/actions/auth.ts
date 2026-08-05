"use server"

import { auth, signOut as nextAuthSignOut } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import type { Profile } from "@/lib/types"

export async function getCurrentUser(): Promise<{
  user: { id: string; matricula: string } | null
  profile: Profile | null
}> {
  const session = await auth()
  if (!session?.user?.profileId) return { user: null, profile: null }

  const { profileId, matricula } = session.user

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single()

  return {
    user: { id: profileId, matricula },
    profile: profile as Profile | null,
  }
}

/**
 * Simplified helper: returns Profile | null directly.
 * Used by RSC pages that just need the profile object.
 */
export async function getProfileForSession(): Promise<Profile | null> {
  const { profile } = await getCurrentUser()
  return profile
}

/** Returns the loja_id from the current session for use in query filters. */
export async function getCurrentLojaId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.lojaId ?? null
}

export async function signOut() {
  await nextAuthSignOut({ redirectTo: "/auth/login" })
}