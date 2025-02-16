"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { checkEmailAvailability } from "@/server/email"
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "@/server/email-verification"
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/session"
import { createUser } from "@/server/user"
import { ReturnType } from "@/types"
import { SignUpSchema } from "@/validators"

export async function signUp(
  values: z.infer<typeof SignUpSchema>,
): Promise<ReturnType> {
  const isEmailAvailable = await checkEmailAvailability(values.email)
  if (!isEmailAvailable) {
    return {
      success: false,
      message: "This email is already in use.",
      key: "email_in_use",
    }
  }

  const user = await createUser(values)

  const emailVerification = await createEmailVerificationRequest(
    user.id,
    user.email,
  )
  sendVerificationEmail(
    user.fullName,
    emailVerification.email,
    emailVerification.code,
  )
  setEmailVerificationRequestCookie(emailVerification)

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, user.id)
  setSessionTokenCookie(sessionToken, session.expiresAt)

  return redirect("/verify-email")
}
