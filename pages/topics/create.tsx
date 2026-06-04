import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

const TopicForm = dynamic(() => import('../../components/TopicForm'), { ssr: false })

export default function CreateTopic(){
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      localStorage.removeItem('user')
      router.push('/auth/login')
    } else {
      setIsAuth(true)
    }
  }, [router])

  if (!isAuth) return null

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Create</p>
        <h2 className="display-ink text-4xl font-black leading-none text-[#06231f]">Materials and teacher rating topics</h2>
      </div>
      <TopicForm />
    </div>
  )
}
