import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Dashboard(){
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'uploads' | 'ratings'>('uploads')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/auth/login')
    } else {
      setUser(JSON.parse(storedUser))
      
      fetch('/api/materials?limit=6')
        .then((res) => {
          if (res.status === 401) throw new Error('Unauthorized')
          return res.json()
        })
        .then((data) => setMaterials(data.materials || []))
        .catch((err) => {
          if (err.message === 'Unauthorized') {
            localStorage.removeItem('user')
            router.push('/auth/login')
          }
          setMaterials([])
        })

      fetch('/api/ratings?limit=6')
        .then((res) => {
          if (res.status === 401) throw new Error('Unauthorized')
          return res.json()
        })
        .then((data) => setRatings(data.ratings || []))
        .catch((err) => {
          if (err.message === 'Unauthorized') {
            localStorage.removeItem('user')
            router.push('/auth/login')
          }
          setRatings([])
        })
    }
  }, [router])

  function handleSearch(e: React.FormEvent){
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <div className="border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
        <h2 className="display-ink text-4xl font-black leading-none text-[#06231f]">Welcome, {user.name}!</h2>
        <p className="mt-3 font-semibold text-[#557169]">Share materials, rate teachers, and grow your learning community.</p>
      </div>

      {/* Dashboard Search */}
      <div className="border-4 border-[#06231f] bg-white p-5 shadow-[8px_8px_0_#06231f]">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-12 flex-1 border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none"
            placeholder="Search for courses, teacher names, or colleges..."
          />
          <button className="border-2 border-[#06231f] bg-[#06231f] px-8 py-3 text-sm font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-2 border-[#06231f] bg-white p-6 shadow-[5px_5px_0_#06231f]">
          <h3 className="text-lg font-black text-[#06231f]">Upload Materials</h3>
          <p className="mb-4 mt-2 text-sm font-semibold text-[#557169]">Upload and manage your course materials</p>
          <Link href="/topics/create" className="font-black text-[#0d5b50] hover:text-[#06231f]">Upload Now</Link>
        </div>
        <div className="border-2 border-[#06231f] bg-[#fffef1] p-6 shadow-[5px_5px_0_#06231f]">
          <h3 className="text-lg font-black text-[#06231f]">Rate Teachers</h3>
          <p className="mb-4 mt-2 text-sm font-semibold text-[#557169]">Share your experience with instructors</p>
          <Link href="/#teachers" className="font-black text-[#0d5b50] hover:text-[#06231f]">Browse Teachers</Link>
        </div>
      </div>

      {/* Latest Uploads & Ratings by other users */}
      <div className="border-4 border-[#06231f] bg-white p-6 shadow-[8px_8px_0_#06231f]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-[#06231f]/10 pb-4">
          <div>
            <h3 className="text-xl font-black text-[#06231f]">Community Activity</h3>
            <p className="text-sm font-semibold text-[#557169]">Latest uploads and ratings done by other users</p>
          </div>
          <div className="flex border-2 border-[#06231f] bg-[#edf7f2] p-1 h-fit">
            <button 
              onClick={() => setActiveTab('uploads')} 
              className={`px-4 py-1.5 text-xs font-black uppercase transition-all ${activeTab === 'uploads' ? 'bg-[#06231f] text-white' : 'text-[#06231f] hover:bg-[#cce8c8]'}`}
            >
              Latest Uploads
            </button>
            <button 
              onClick={() => setActiveTab('ratings')} 
              className={`px-4 py-1.5 text-xs font-black uppercase transition-all ${activeTab === 'ratings' ? 'bg-[#06231f] text-white' : 'text-[#06231f] hover:bg-[#cce8c8]'}`}
            >
              Latest Ratings
            </button>
          </div>
        </div>

        {activeTab === 'uploads' ? (
          materials.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {materials.slice(0, 6).map((material) => (
                <div key={material.id} className="border-2 border-[#06231f] bg-white p-4 shadow-[4px_4px_0_#06231f] flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">
                      {material.course} - {material.institution}
                    </p>
                    <h4 className="mt-1 font-black text-[#06231f] hover:text-[#0d5b50]">
                      <Link href={`/topics/${material.topic_id || material.id}`}>{material.title}</Link>
                    </h4>
                    <p className="mt-2 text-xs font-semibold text-[#557169]">
                      Lecturer: <Link href={`/teachers/${encodeURIComponent(material.teacher_name)}`} className="font-black text-[#0d5b50] hover:text-[#06231f]">{material.teacher_name}</Link>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#06231f]/10 pt-2.5 text-xs text-[#557169]">
                    <span>By {material.uploader_name || 'Student'}</span>
                    {material.file_url ? (
                      <a href={material.file_url} download className="font-black text-[#0d5b50] hover:text-[#06231f]">Download</a>
                    ) : (
                      <Link href={`/topics/${material.topic_id || material.id}`} className="font-black text-[#0d5b50] hover:text-[#06231f]">View</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-semibold text-[#557169] text-center py-6">No materials shared yet.</p>
          )
        ) : (
          ratings.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {ratings.slice(0, 6).map((rating) => (
                <div key={rating.id} className="border-2 border-[#06231f] bg-[#fffef1] p-4 shadow-[4px_4px_0_#06231f] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50] truncate">
                        {rating.course} - {rating.institution}
                      </p>
                      <div className="bg-[#06231f] text-white px-2 py-0.5 text-xs font-black shrink-0">
                        {rating.score}/5
                      </div>
                    </div>
                    <h4 className="mt-1 font-black text-[#06231f]">
                      Rated:{' '}
                      <Link href={`/teachers/${encodeURIComponent(rating.teacher_name)}`} className="hover:text-[#0d5b50]">
                        {rating.teacher_name}
                      </Link>
                    </h4>
                    {rating.comment && (
                      <p className="mt-2 bg-white border border-[#06231f]/10 p-2.5 text-xs font-semibold italic text-[#39564f] line-clamp-3">
                        &quot;{rating.comment}&quot;
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-[#557169] border-t border-[#06231f]/10 pt-2">
                    <span>By {rating.user_name || 'Anonymous'}</span>
                    <span>{rating.school_year}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-semibold text-[#557169] text-center py-6">No ratings yet.</p>
          )
        )}
      </div>
    </div>
  )
}
