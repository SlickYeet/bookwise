"use server"

import { compare } from "bcryptjs"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { ratelimit } from "@/lib/ratelimit"
import { db } from "@/server/db"
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "@/server/session"
import { ReturnType } from "@/types"
import { SignInSchema } from "@/validators"

export async function signIn(
  values: z.infer<typeof SignInSchema>,
): Promise<ReturnType> {
  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  if (!success) return redirect("too-fast")

  try {
    SignInSchema.parse(values)
  } catch {
    return {
      success: false,
      message: "Invalid email or password",
      key: "invalid_credentials",
    }
  }

  const user = await db.user.findUnique({
    where: { email: values.email },
  })
  if (user === null) {
    return {
      success: false,
      message: "No user with that email found",
      key: "user_not_found",
    }
  }

  if (user.password !== null) {
    const isPasswordValid = compare(values.password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid email or password",
        key: "invalid_password",
      }
    }
  }

  const sessionToken = generateSessionToken()
  const session = await createSession(sessionToken, user.id)
  setSessionTokenCookie(sessionToken, session.expiresAt)

  if (user.status === "PENDING") {
    return redirect("/verify-email")
  }

  return redirect("/")
}
