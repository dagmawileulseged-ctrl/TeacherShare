import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import Header from '../components/Header'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isLandingPage = router.pathname === '/'

  return (
    <>
      <Header />
      <main className={isLandingPage ? 'w-full' : 'container py-8'}>
        <Component {...pageProps} />
      </main>
    </>
  )
}
