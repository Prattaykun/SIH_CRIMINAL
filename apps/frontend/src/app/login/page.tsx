"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ShieldAlert, LogIn, Lock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  surfaceBtnPrimary,
  surfaceCard,
  surfaceInput,
} from "@/components/layout/surface";

const DEMO_PASSWORD = "DemoPassword123!";
const DEMO_ACCOUNTS = [
  "demo_investigator",
  "demo_admin",
  "demo_analyst",
  "demo_reviewer",
] as const;

export default function LoginPage() {
  const { login, user, token, loginSplashPending } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only bounce already-authenticated sessions — wait for splash after a fresh login.
    if (user && token && !loginSplashPending) {
      router.replace("/cases");
    }
  }, [user, token, loginSplashPending, router]);

  const fillDemoAccount = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login(username, password);
      login(response.access_token, response.user);
      // Splash overlay plays first; navigate once it is showing so the app is ready underneath.
      router.push("/cases");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to login. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className={cn(surfaceCard, "w-full max-w-md gap-0 py-0 ring-0")}>
        <CardHeader className="flex flex-col items-center px-6 pt-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/15 text-blue-400">
            <ShieldAlert size={28} />
          </div>
          <CardTitle className="text-2xl font-semibold text-white">
            GoyendaBondhu
          </CardTitle>
          <CardDescription className="mt-1 text-sm text-white/45">
            Criminal Network Analysis System
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-2">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-center text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/70">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                required
                className={surfaceInput}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. demo_investigator"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  required
                  className={cn(surfaceInput, "pr-10")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(surfaceBtnPrimary, "w-full")}
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="mt-2 flex flex-col border-t border-white/[0.08] px-6 py-6">
          <div className="w-full space-y-1.5 text-center text-xs text-white/45">
            <span className="font-semibold text-white/70">
              Synchronized Evaluator / Demo Accounts:
            </span>
            <p className="text-[11px] text-white/35">
              Click an account to autofill username and password
            </p>
            <div className="flex flex-wrap justify-center gap-1 py-1">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-1.5 py-0.5 font-mono text-[11px] transition-colors",
                    username === account
                      ? "border-blue-500/50 bg-blue-600/30 text-blue-200"
                      : "border-transparent bg-white/[0.05] text-blue-300 hover:border-white/[0.12] hover:bg-white/[0.08]"
                  )}
                >
                  {account}
                </button>
              ))}
            </div>
            <div className="text-white/45">
              Fixed Password:{" "}
              <code className="rounded-lg bg-white/[0.05] px-1.5 py-0.5 font-mono font-semibold text-emerald-400">
                {DEMO_PASSWORD}
              </code>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
