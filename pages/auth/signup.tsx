import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { universities } from '../../components/UniversityLogos'

export default function SignUp(){
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institute: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>){
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.institute || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Could not create account')
      return
    }

    localStorage.setItem('user', JSON.stringify(data.user))
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="grid overflow-hidden border-4 border-[#06231f] bg-[#edf7f2] shadow-[10px_10px_0_#06231f] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Join the hub</p>
            <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">Create account</h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-[#557169]">
              Select your institute so materials and teacher profiles can be matched correctly.
            </p>

            {error && <div className="mt-5 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="Your full name"
                />
              </div>
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
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black text-[#06231f]">Institute</label>
                <select
                  name="institute"
                  value={formData.institute}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                >
                  <option value="">Select your institute</option>
                  {universities.map((university) => (
                    <option key={university.name} value={university.name}>{university.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="Create a password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black text-[#06231f]">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none transition focus:bg-[#fffef1] focus:shadow-[4px_4px_0_#06231f]"
                  placeholder="Repeat password"
                />
              </div>
              <button type="submit" className="md:col-span-2 w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]">
                Create account
              </button>
            </form>

            <p className="mt-5 text-sm font-semibold text-[#557169]">
              Already have an account? <Link href="/auth/login" className="font-black text-[#0d5b50] hover:text-[#06231f]">Login</Link>
            </p>
          </div>
        </section>

        <aside className="relative overflow-hidden bg-[#cfe8c9] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[24px] border-[#fffef1]/55" />
          <div className="pointer-events-none absolute -bottom-20 left-8 h-60 w-60 rounded-t-full bg-[#24584f]/25" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Why sign up</p>
            <h2 className="display-ink mt-3 text-5xl font-black leading-none text-[#06231f]">Make the search better for everyone</h2>
            <div className="mt-8 grid gap-4">
              {[
                ['Upload', 'Share notes, slides, and exam packs.'],
                ['Rate', 'Help students compare teachers across colleges.'],
                ['Connect', 'Keep institute context attached to every contribution.'],
              ].map(([title, text]) => (
                <div key={title} className="border-2 border-[#06231f] bg-[#fffef1] p-4 shadow-[4px_4px_0_#06231f]">
                  <p className="font-black text-[#06231f]">{title}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#557169]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
