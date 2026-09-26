'use client'

import { ReactNode, useEffect } from 'react'
import { ConvexReactClient, useAction } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth, useUser } from '@clerk/nextjs'

import { api } from '../../convex/_generated/api'

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser()
  const syncUser = useAction(api.users.sync)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    syncUser().catch((error) => {
      console.error('Failed to sync signed-in user', error)
    })
  }, [isLoaded, isSignedIn, user?.id, syncUser])

  return null
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSync />
      {children}
    </ConvexProviderWithClerk>
  )
}
