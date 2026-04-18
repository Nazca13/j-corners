'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, ChevronLeft, Eye, EyeOff } from '@/components/icons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Clear any stale/bad token before attempting login
    try { window.localStorage.removeItem('jcorners-auth') } catch (_e) {}

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
      <Link href="/" className="absolute top-6 left-6 w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-border btn-press z-10" aria-label="Kembali ke Beranda">
        <ChevronLeft size={18} className="text-text" />
      </Link>

      <div className="w-full max-w-sm animate-scale-in">
        <div className="bg-surface rounded-3xl p-8 shadow-lg border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-text">Owner Login</h1>
            <p className="text-xs text-text-secondary mt-1">Masuk ke dapur J-Corners</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gmail.com" required
                className="w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-tertiary hover:text-text transition-colors rounded-lg"
                  aria-label={showPass ? 'Sembunyikan' : 'Tampilkan'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-danger bg-danger-light text-xs font-bold text-center p-3 rounded-xl border border-red-100 animate-scale-in">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg btn-press mt-2 flex justify-center items-center gap-2 disabled:opacity-60">
              {loading ? (<><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>) : 'Masuk Dashboard'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-text-tertiary mt-6">© 2026 J-Corners. All rights reserved.</p>
      </div>
    </main>
  )
}