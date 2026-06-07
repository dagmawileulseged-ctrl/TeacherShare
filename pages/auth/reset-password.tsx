import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Verification token is missing. Please check your email link.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Both password fields are required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Could not reset password')
        return
      }

      setSuccess('Your password has been successfully reset!')
      setPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
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
            <h2 className="display-ink mt-3 text-5xl font-black leading-none text-[#06231f]">Set a new password</h2>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[#39564f]">
              Ensure your account remains secure. Pick a strong, unique password that you do not use elsewhere.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-black text-[#06231f]">
              {['Min. 8 characters', 'Scrypt security hashing', 'Immediate login redirect'].map((item) => (
                <div key={item} className="border-2 border-[#06231f] bg-[#fffef1] px-4 py-3 shadow-[4px_4px_0_#06231f]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Account Update</p>
            <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">Reset Password</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#557169]">
              Enter and confirm your new password below.
            </p>

            {error && <div className="mt-5 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
            {success && (
              <div className="mt-5 border-2 border-emerald-800 bg-emerald-50 p-3 text-sm font-black text-emerald-800">
                {success} Redirecting to login...
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="New password"
                  disabled={loading || !!success}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="Confirm new password"
                  disabled={loading || !!success}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <p className="mt-5 text-sm font-semibold text-[#557169]">
              Remembered? <Link href="/auth/login" className="font-black text-[#0d5b50] hover:text-[#06231f]">Back to Login</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
