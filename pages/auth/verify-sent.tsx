import { useRouter } from 'next/router'
import Link from 'next/link'

export default function VerifySent() {
  const router = useRouter()
  const email = String(router.query.email || '')

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="grid overflow-hidden border-4 border-[#06231f] bg-[#edf7f2] shadow-[10px_10px_0_#06231f] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative min-h-72 overflow-hidden bg-[#cfe8c9] p-7 sm:p-10">
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-t-full bg-[#24584f]/25" />
          <div className="pointer-events-none absolute -right-20 top-12 h-60 w-60 rounded-full border-[24px] border-[#fffef1]/55" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Registration Step 2</p>
            <h2 className="display-ink mt-3 text-5xl font-black leading-none text-[#06231f]">Almost there!</h2>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[#39564f]">
              Before accessing your dashboard, you must verify your email address to confirm your registration.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-black text-[#06231f]">
              {['Access teacher ratings', 'Upload learning materials', 'Join course discussions'].map((item) => (
                <div key={item} className="border-2 border-[#06231f] bg-[#fffef1] px-4 py-3 shadow-[4px_4px_0_#06231f]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white p-6 sm:p-10 flex flex-col justify-center">
          <div className="mx-auto max-w-md w-full">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Email Verification Sent</p>
            <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">Check Your Inbox</h1>
            
            <div className="mt-6 border-2 border-[#06231f] bg-[#fffef1] p-6 shadow-[4px_4px_0_#06231f]">
              <p className="text-sm font-semibold leading-6 text-[#39564f]">
                We have sent a verification email to:
              </p>
              <p className="mt-2 text-base font-black text-[#06231f] break-all">
                {email || 'your registered email address'}
              </p>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#557169]">
                Please click the link inside the email to verify your account. Once verified, you will be able to log in.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Link 
                href="/auth/login" 
                className="block text-center w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]"
              >
                Go to Login
              </Link>
              <p className="text-xs text-center font-semibold text-[#557169]">
                Did not receive the email? Check your spam folder or wait a moment.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
