import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setSuccess('If an account exists with this email, a reset link has been sent. Please check your inbox.')
      setEmail('')
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="grid overflow-hidden border-4 border-[#06231f] bg-[#edf7f2] shadow-[10px_10px_0_#06231f] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative min-h-72 overflow-hidden bg-[#cfe8c9] p-7 sm:p-10">
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-t-full bg-[#24584f]/25" />
          <div className="pointer-events-none absolute -right-20 top-12 h-60 w-60 rounded-full border-[24px] border-[#fffef1]/55" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Security</p>
            <h2 className="display-ink mt-3 text-5xl font-black leading-none text-[#06231f]">Recover your account</h2>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[#39564f]">
              Forgot your password? No worries. Enter your email and we'll send you a secure link to reset it.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-black text-[#06231f]">
              {['Secure reset tokens', '1-hour expiration link', 'Direct inbox delivery'].map((item) => (
                <div key={item} className="border-2 border-[#06231f] bg-[#fffef1] px-4 py-3 shadow-[4px_4px_0_#06231f]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Password Recovery</p>
            <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">Forgot Password</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#557169]">
              Enter the email address associated with your account and we will email you a password reset link.
            </p>

            {error && <div className="mt-5 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
            {success && <div className="mt-5 border-2 border-emerald-800 bg-emerald-50 p-3 text-sm font-black text-emerald-800">{success}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="you@college.edu"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-5 text-sm font-semibold text-[#557169]">
              Remember your password? <Link href="/auth/login" className="font-black text-[#0d5b50] hover:text-[#06231f]">Back to Login</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
