import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard(){
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!storedUser || !token) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/auth/login')
    } else {
      setUser(JSON.parse(storedUser))
      fetch('/api/materials')
        .then((res) => res.json())
        .then((data) => setMaterials(data.materials || []))
        .catch(() => setMaterials([]))
    }
  }, [router])

  if (!user) return null

  return (
    <div className="space-y-8">
      <div className="border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
        <h2 className="display-ink text-4xl font-black leading-none text-[#06231f]">Welcome, {user.name}!</h2>
        <p className="mt-3 font-semibold text-[#557169]">Share materials, rate teachers, and grow your learning community.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-2 border-[#06231f] bg-white p-6 shadow-[5px_5px_0_#06231f]">
          <h3 className="text-lg font-black text-[#06231f]">My Materials</h3>
          <p className="mb-4 mt-2 text-sm font-semibold text-[#557169]">Upload and manage your course materials</p>
          <Link href="/topics/create" className="font-black text-[#0d5b50] hover:text-[#06231f]">Upload Now</Link>
        </div>
        <div className="border-2 border-[#06231f] bg-[#fffef1] p-6 shadow-[5px_5px_0_#06231f]">
          <h3 className="text-lg font-black text-[#06231f]">Rate Teachers</h3>
          <p className="mb-4 mt-2 text-sm font-semibold text-[#557169]">Share your experience with instructors</p>
          <Link href="/#teachers" className="font-black text-[#0d5b50] hover:text-[#06231f]">Browse Teachers</Link>
        </div>
      </div>

      <div className="border-4 border-[#06231f] bg-white p-6">
        <h3 className="mb-4 text-xl font-black text-[#06231f]">Recent Materials</h3>
        {materials.length ? (
          <div className="divide-y-2 divide-[#06231f]/10">
            {materials.map((material) => (
              <Link key={material.id} href={`/topics/${material.topic_id || material.id}`} className="block py-4 hover:bg-[#f2fbf3]">
                <p className="font-black text-[#06231f]">{material.title}</p>
                <p className="mt-1 text-sm font-semibold text-[#557169]">{material.course} - {material.teacher_name} - {material.institution}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-semibold text-[#557169]">No materials yet. Start by <Link href="/topics/create" className="font-black text-[#0d5b50]">uploading a material</Link>.</p>
        )}
      </div>
    </div>
  )
}
