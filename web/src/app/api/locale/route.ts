import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/config";

export async function POST(request: Request) {
  let locale = DEFAULT_LOCALE;
  try {
    const body = (await request.json()) as { locale?: string };
    if (isLocale(body.locale)) locale = body.locale;
  } catch {
    locale = DEFAULT_LOCALE;
  }
  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
