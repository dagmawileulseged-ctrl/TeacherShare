import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Header(){
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<any>(null)
  const isLandingPage = router.pathname === '/'

  useEffect(() => {
    function syncUser(){
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setIsAuth(true)
        setUser(JSON.parse(storedUser))
      } else {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setIsAuth(false)
        setUser(null)
      }
    }

    syncUser()
    router.events.on('routeChangeComplete', syncUser)
    window.addEventListener('storage', syncUser)

    return () => {
      router.events.off('routeChangeComplete', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [router.events])

  useEffect(() => {
    let lastChecked = 0
    const CHECK_INTERVAL = 60 * 1000 // 1 minute throttle

    async function checkSession() {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return

      const now = Date.now()
      if (now - lastChecked < CHECK_INTERVAL) return
      lastChecked = now

      try {
        const res = await fetch('/api/auth/me')
        if (res.status === 401) {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          window.dispatchEvent(new Event('storage'))
          
          const protectedRoutes = ['/dashboard', '/topics/create']
          if (protectedRoutes.includes(router.pathname)) {
            router.push('/auth/login')
          }
        }
      } catch (err) {
        // network/server error, ignore to avoid false logouts
      }
    }

    checkSession()
    window.addEventListener('focus', checkSession)
    router.events.on('routeChangeComplete', checkSession)

    return () => {
      window.removeEventListener('focus', checkSession)
      router.events.off('routeChangeComplete', checkSession)
    }
  }, [router.pathname, router.events])

  async function handleLogout(){
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setIsAuth(false)
    setUser(null)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/')
  }

  const shellClass = isLandingPage
    ? 'mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between'
    : 'container flex items-center justify-between py-4'

  return (
    <header className="sticky top-0 z-30 border-b-4 border-[#092f2a] bg-[#06231f] text-[#edf7e7] shadow-[0_6px_0_rgba(6,35,31,0.16)]">
      <div className={shellClass}>
        <Link href="/" className="group flex w-fit items-center gap-3">
          <span className="grid h-11 w-11 place-items-center border-2 border-[#edf7e7] bg-[#f7f1bd] text-lg font-black text-[#06231f] shadow-[4px_4px_0_#0a332e]">
            ACH
          </span>
          <span>
            <span className="display-ink block text-xl font-black leading-none text-[#edf7e7]">Addis Course Hub</span>
            <span className="hidden text-xs font-bold uppercase tracking-wide text-[#bdd5ca] sm:block">Materials and teacher ratings</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-black text-[#cfe3d8] lg:justify-end">
          {isAuth ? (
            <>
              <Link href="/dashboard" className="px-3 py-2 transition hover:bg-[#0a332e] hover:text-white">Dashboard</Link>
              <Link href="/browse" className="px-3 py-2 transition hover:bg-[#0a332e] hover:text-white">Browse</Link>
              <Link href="/topics/create" className="px-3 py-2 transition hover:bg-[#0a332e] hover:text-white">Upload</Link>
              <span className="hidden px-3 py-2 text-[#bdd5ca] md:inline">Hi, {user?.name || 'User'}</span>
              <button onClick={handleLogout} className="border-2 border-[#edf7e7] bg-transparent px-3 py-1.5 text-sm text-[#edf7e7] transition hover:bg-[#edf7e7] hover:text-[#06231f]">Logout</button>
            </>
          ) : (
            <>
              <Link href="/browse" className="px-3 py-2 transition hover:bg-[#0a332e] hover:text-white">Browse</Link>
              <Link href="/#colleges" className="hidden px-3 py-2 transition hover:bg-[#0a332e] hover:text-white md:inline">Colleges</Link>
              <Link href="/#teachers" className="hidden px-3 py-2 transition hover:bg-[#0a332e] hover:text-white md:inline">Teachers</Link>
              <Link href="/#about" className="hidden px-3 py-2 transition hover:bg-[#0a332e] hover:text-white lg:inline">How it works</Link>
              <Link href="/auth/login" className="border-2 border-[#edf7e7] px-4 py-2 text-[#edf7e7] transition hover:bg-[#edf7e7] hover:text-[#06231f]">Login</Link>
              <Link href="/auth/signup" className="border-2 border-[#edf7e7] bg-[#edf7e7] px-4 py-2 text-[#06231f] transition hover:bg-[#f7f1bd]">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
