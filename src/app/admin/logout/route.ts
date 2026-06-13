import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(
    new URL("/admin/login", process.env.APP_URL ?? "http://localhost:3000"),
  );
}
