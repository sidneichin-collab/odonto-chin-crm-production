import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    console.log("[OAuth] Callback received - code:", code?.substring(0, 10) + "...", "state:", state?.substring(0, 20) + "...");
    
    try {
      console.log("[OAuth] Exchanging code for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token received successfully");
      console.log("[OAuth] Getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info received:", { openId: userInfo.openId, email: userInfo.email, loginMethod: userInfo.loginMethod });

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      console.log("[OAuth] Upserting user to database...");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      console.log("[OAuth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[OAuth] Login successful! Redirecting to /");
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[OAuth] Callback failed - Full error:", JSON.stringify(error, null, 2));
      console.error("[OAuth] Error code:", error?.code);
      console.error("[OAuth] Error message:", error?.message);
      console.error("[OAuth] Error response:", error?.response?.data);
      
      // Handle specific Manus OAuth errors
      const errorCode = error?.code || error?.response?.data?.code;
      const errorMessage = error?.message || error?.response?.data?.message || "Unknown error";
      
      // Error 1043: Email already registered with different login method
      if (errorCode === 1043 || errorMessage.includes("mailbox has been registered")) {
        const returnPath = "/login?error=1043";
        res.redirect(302, returnPath);
        return;
      }
      
      // Error 1003: Connection or permission issues
      if (errorCode === 1003) {
        const returnPath = "/login?error=1003";
        res.redirect(302, returnPath);
        return;
      }
      
      // Generic error
      res.redirect(302, "/login?error=generic");
    }
  });
}
