import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function VerifyEmail() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email address...')
  const verifyAttempted = useRef(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!token) {
      setStatus('error')
      setMessage('No verification token was provided in the URL.')
      return
    }

    if (verifyAttempted.current) return
    verifyAttempted.current = true

    async function doVerify() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(String(token))}`)
        const data = await response.json()
        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Your email address has been successfully verified!')
        } else {
          setStatus('error')
          setMessage(data.error || 'The verification link is invalid or has expired.')
        }
      } catch (err) {
        console.error(err)
        setStatus('error')
        setMessage('An unexpected error occurred during verification. Please try again.')
      }
    }

    doVerify()
  }, [router.isReady, token])

  return (
    <div className="mx-auto max-w-xl py-12">
      <div className="overflow-hidden border-4 border-[#06231f] bg-[#edf7f2] shadow-[10px_10px_0_#06231f] p-8 sm:p-12">
        <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Account verification</p>
        <h1 className="display-ink mt-3 text-4xl font-black leading-none text-[#06231f]">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <div className="mt-6 border-2 border-[#06231f] bg-white p-6 shadow-[4px_4px_0_#06231f]">
          {status === 'loading' && (
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#06231f] border-t-transparent" />
              <p className="font-semibold text-[#39564f]">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <p className="font-semibold text-emerald-800">{message}</p>
              <p className="mt-4 text-sm text-[#557169]">
                You can now log in and access all features of TeacherShare, including uploading materials, leaving ratings, and commenting on discussions.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <p className="font-semibold text-red-700">{message}</p>
              <p className="mt-4 text-sm text-[#557169]">
                If you registered recently, you might need to register again, request a new link, or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          {status === 'success' ? (
            <Link
              href="/auth/login"
              className="border-2 border-[#06231f] bg-[#06231f] px-6 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]"
            >
              Go to Login
            </Link>
          ) : status === 'error' ? (
            <Link
              href="/auth/signup"
              className="border-2 border-[#06231f] bg-[#06231f] px-6 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]"
            >
              Sign Up Again
            </Link>
          ) : (
            <Link
              href="/"
              className="border-2 border-[#06231f] bg-[#fffef1] px-6 py-3 text-sm font-black uppercase text-[#06231f] transition hover:bg-[#f7f1bd]"
            >
              Cancel
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
