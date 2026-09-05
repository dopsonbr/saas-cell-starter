import type { PropsWithChildren } from 'react'
import {
  ClerkProvider,
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useOrganization,
  useUser,
} from '@clerk/react'
import { shadcn } from '@clerk/ui/themes'

export type AuthProviderProps = PropsWithChildren<{
  publishableKey: string
}>

export function AuthProvider({ publishableKey, children }: AuthProviderProps) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{ theme: { ...shadcn, cssLayerName: 'clerk' } }}
    >
      {children}
    </ClerkProvider>
  )
}

export {
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useOrganization,
  useUser,
}
