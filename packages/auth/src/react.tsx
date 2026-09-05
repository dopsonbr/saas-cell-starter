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
import type { PropsWithChildren } from 'react'

export type AuthProviderProps = PropsWithChildren<{
  publishableKey: string
}>

export function AuthProvider({ publishableKey, children }: AuthProviderProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
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
