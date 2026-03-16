'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const features = [
  {
    title: 'Multi-tenant Architecture',
    description: 'Manage unlimited beauty businesses from one platform',
  },
  {
    title: 'Advanced Analytics',
    description: 'Real-time insights and performance metrics',
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-level encryption and data protection',
  },
]

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Credenciais inválidas')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      {/* Left panel — purple gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden"
        style={{
          background:
            'linear-gradient(130deg, #7d549e 0%, #6b4589 50%, #654285 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-48 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-40 w-80 h-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <SparkleIcon />
            </div>
            <div>
              <p className="text-white text-2xl font-semibold leading-8">Beautly</p>
              <p className="text-white/70 text-sm">Beauty &amp; Aesthetics Platform</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h2 className="text-white text-4xl font-semibold leading-[1.25] mb-6">
              Manage your beauty
              <br />
              business with elegance
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-lg">
              The premium SaaS platform designed for beauty and aesthetics
              businesses. Streamline scheduling, client management, and
              operations all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-6 flex-1">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <CheckIcon />
                </div>
                <div>
                  <p className="text-white text-lg font-medium leading-[27px]">
                    {f.title}
                  </p>
                  <p className="text-white/70 text-sm">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-white/50 text-sm mt-8">
            © 2026 Beautly. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{
          background:
            'linear-gradient(130deg, #faf8fb 0%, #fbf9fc 17%, #fcfbfc 33%, #fdfcfd 50%, #fcfbfd 67%, #fbfafd 83%, #faf9fd 100%)',
        }}
      >
        <div className="w-full max-w-[448px]">
          {/* Card */}
          <div className="bg-white/80 border border-[#e8e8ea] rounded-3xl shadow-[0_20px_40px_0_rgba(99,98,105,0.2)] px-10 pt-10 pb-10 mb-6">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-[#1f1f24] text-3xl font-semibold leading-9 mb-2">
                Super Admin Login
              </h1>
              <p className="text-[#868691] text-base leading-6">
                Access the Beautly control panel to manage tenants,
                subscriptions, and platform operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[#1f1f24] text-sm font-medium">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@beautly.com"
                  className="w-full h-[52px] bg-[#fafafa] border-2 border-[#d1d1d5] rounded-2xl px-4 text-base text-[#1f1f24] placeholder:text-[#868691] outline-none focus:border-[#7d549e] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[#1f1f24] text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full h-[52px] bg-[#fafafa] border-2 border-[#d1d1d5] rounded-2xl px-4 pr-12 text-base text-[#1f1f24] placeholder:text-[#868691] outline-none focus:border-[#7d549e] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#868691] hover:text-[#1f1f24] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className="text-[#868691] text-sm">
                  Minimum 8 characters required
                </p>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="remember"
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-[10px] border-2 border-[#d1d1d5] bg-[#fafafa] peer-checked:bg-[#7d549e] peer-checked:border-[#7d549e] transition-colors" />
                  <span className="text-[#1f1f24] text-sm font-medium">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-[#7d549e] text-sm hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-sm -mt-2">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[60px] bg-[#7d549e] text-white text-lg font-medium rounded-2xl shadow-sm hover:bg-[#6b4589] active:bg-[#5e3b79] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>

              {/* Security note */}
              <div className="flex items-center gap-2 bg-[#f5f5f6] rounded-2xl px-3 py-4">
                <ShieldIcon />
                <p className="text-[#868691] text-xs leading-4">
                  Your connection is encrypted and secure. This admin panel
                  uses bank-level security.
                </p>
              </div>
            </form>
          </div>

          {/* Need help */}
          <p className="text-center text-[#868691] text-sm mb-6">
            Need help?{' '}
            <button className="text-[#7d549e] hover:underline">
              Contact Support
            </button>
          </p>

          {/* Terms */}
          <div className="border-t border-[#e8e8ea] pt-6">
            <p className="text-center text-[#868691] text-xs">
              By signing in, you agree to our{' '}
              <span className="text-[#1f1f24] cursor-pointer hover:underline">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-[#1f1f24] cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 3.5L16.8 11.2H24.5L18.85 15.8L21.65 23.5L14 18.55L6.35 23.5L9.15 15.8L3.5 11.2H11.2L14 3.5Z"
        fill="white"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M16.667 5.833L7.5 15 3.333 10.833"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2.5 10C2.5 10 5 4.167 10 4.167C15 4.167 17.5 10 17.5 10C17.5 10 15 15.833 10 15.833C5 15.833 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.083" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2.5 10C2.5 10 5 4.167 10 4.167C15 4.167 17.5 10 17.5 10C17.5 10 15 15.833 10 15.833C5 15.833 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.083" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.333 3.333L16.667 16.667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0 text-[#868691]"
      aria-hidden
    >
      <path
        d="M8 1.333L2 4v4c0 3.5 2.667 6.773 6 7.333 3.333-.56 6-3.833 6-7.333V4L8 1.333Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.333 8L7.333 10l3.334-3.333"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
