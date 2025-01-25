import { generateCodeVerifier, generateState } from "arctic"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"

import { ratelimit } from "@/lib/ratelimit"
import { google } from "@/server/oauth"

export async function GET(): Promise<NextResponse> {
  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  if (!success) return redirect("too-fast")

  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ])

  const cookieStore = await cookies()

  cookieStore.set("google_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  })
  cookieStore.set("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  })

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  })
}
