import { NextResponse } from "next/server"

import { authCookieName } from "@/lib/auth"

export async function POST() {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": `${authCookieName}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
      },
    }
  )
}
