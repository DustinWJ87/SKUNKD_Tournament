"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      gamerTag: formData.get("gamerTag") as string,
    }

    const confirmPassword = formData.get("confirmPassword") as string

    if (data.password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create account")
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <header className="text-center">
        <h1 className="font-display text-4xl uppercase text-white">Sign Up</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/60">
          Join the Skunkd Community
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-white/80">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label htmlFor="gamerTag" className="mb-2 block text-sm font-medium text-white/80">
              Gamer Tag (Optional)
            </label>
            <input
              id="gamerTag"
              name="gamerTag"
              type="text"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="xXProGamerXx"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-white/50">At least 8 characters</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-skunkd-cyan focus:outline-none focus:ring-2 focus:ring-skunkd-cyan/50"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-skunkd-purple px-8 py-3 font-semibold uppercase tracking-wide text-white shadow-neon transition hover:bg-skunkd-magenta hover:shadow-cyan disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-white/60">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-skunkd-cyan hover:text-skunkd-cyan/80 transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
