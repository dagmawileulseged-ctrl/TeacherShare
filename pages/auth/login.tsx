import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login(){
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>){
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Could not log in')
      return
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="grid overflow-hidden border-4 border-[#06231f] bg-[#edf7f2] shadow-[10px_10px_0_#06231f] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative min-h-72 overflow-hidden bg-[#cfe8c9] p-7 sm:p-10">
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-t-full bg-[#24584f]/25" />
          <div className="pointer-events-none absolute -right-20 top-12 h-60 w-60 rounded-full border-[24px] border-[#fffef1]/55" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Welcome back</p>
            <h2 className="display-ink mt-3 text-5xl font-black leading-none text-[#06231f]">Pick up where you left off</h2>
            <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-[#39564f]">
              Upload materials, rate teachers, and keep your college searches connected across Addis institutions.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-black text-[#06231f]">
              {['Saved profile', 'Faster uploads', 'Teacher ratings'].map((item) => (
                <div key={item} className="border-2 border-[#06231f] bg-[#fffef1] px-4 py-3 shadow-[4px_4px_0_#06231f]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Student access</p>
            <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">Login</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#557169]">Use the email and password you created to manage uploads, topics, and ratings.</p>

            {error && <div className="mt-5 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="you@college.edu"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="Enter your password"
                />
              </div>
              <button type="submit" className="w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]">
                Login
              </button>
            </form>

            <p className="mt-5 text-sm font-semibold text-[#557169]">
              New here? <Link href="/auth/signup" className="font-black text-[#0d5b50] hover:text-[#06231f]">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
