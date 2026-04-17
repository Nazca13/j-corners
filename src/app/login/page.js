'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FormField from '@/components/FormField'
import { Lock, Loader2, ChevronLeft } from '@/components/icons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email atau password salah.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6 relative">
      {/* Back to Home */}
      <Link
        href="/"
        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press z-10"
        aria-label="Kembali ke Beranda"
      >
        <ChevronLeft size={18} className="text-text" />
      </Link>

      <div className="w-full max-w-sm animate-scale-in">
        {/* Card */}
        <div className="bg-surface rounded-3xl p-8 shadow-lg border border-border">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-text">Owner Login</h1>
            <p className="text-xs text-text-secondary mt-1">Masuk ke dapur J-Corners</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <FormField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              required
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* Error */}
            {error && (
              <div className="text-danger bg-danger-light text-xs font-bold text-center p-3 rounded-xl border border-red-100 animate-scale-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg btn-press mt-2 flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Masuk Dashboard'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-tertiary mt-6">
          © 2026 J-Corners. All rights reserved.
        </p>
      </div>
    </main>
  )
}