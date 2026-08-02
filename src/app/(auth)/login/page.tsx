"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Password salah!");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              Exspend
            </span>
          </CardTitle>
          <CardDescription className="text-sm">Track every rupiah. Kenali polamu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memverifikasi..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
