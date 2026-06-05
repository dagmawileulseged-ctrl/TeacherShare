import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function TeacherProfile(){
  const router = useRouter()
  const { query } = router
  const id = query.id as string | undefined
  const teacherName = id ? decodeURIComponent(id) : ''
  const [teacher, setTeacher] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [ratings, setRatings] = useState<any[]>([])
  const [score, setScore] = useState('5')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [schoolYear, setSchoolYear] = useState('')
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function loadTeacher(){
    if (!id) return
    fetch(`/api/teachers/${encodeURIComponent(teacherName)}`)
      .then((res) => res.json())
      .then((data) => {
        setTeacher(data.teacher)
        setMaterials(data.materials || [])
        setRatings(data.ratings || [])
      })
      .catch(() => setError('Could not load teacher'))
  }

  useEffect(() => {
    loadTeacher()
  }, [id])

  async function submitRating(e: React.FormEvent){
    e.preventDefault()
    setError('')
    setMessage('')

    const user = localStorage.getItem('user')
    if (!user) {
      setError('Please log in before rating a teacher.')
      router.push('/auth/login')
      return
    }

    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teacher: teacherName, institution, course, schoolYear, score, comment, isAnonymous }),
    })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('user')
        setError('Session expired. Please log in again.')
        router.push('/auth/login')
        return
      }
      setError(data.error || 'Could not save rating')
      return
    }

    setMessage('Rating saved.')
    setInstitution('')
    setCourse('')
    setSchoolYear('')
    setComment('')
    loadTeacher()
  }

  return (
    <div className="space-y-6">
      <div className="border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
        <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Teacher profile</p>
        <h2 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">{teacherName}</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <p className="font-semibold text-[#557169]">
            Rating: <span className="font-black text-[#06231f]">{teacher?.rating || 0}</span> from {teacher?.rating_count || 0} ratings
          </p>
          {teacher?.institutions && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Lectures at:</span>
              {String(teacher.institutions).split(',').filter(Boolean).map((inst: string) => (
                <span key={inst} className="rounded-full bg-[#06231f] px-2.5 py-0.5 text-xs font-black text-white">{inst.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitRating} className="border-4 border-[#06231f] bg-white p-6">
          <h3 className="text-xl font-black text-[#06231f]">Rate this teacher</h3>
          {error && <div className="mt-4 border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
          {message && <div className="mt-4 border-2 border-[#0d5b50] bg-[#e3f4df] p-3 text-sm font-black text-[#0d5b50]">{message}</div>}

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-black text-[#06231f]">Score</label>
              <select value={score} onChange={(e) => setScore(e.target.value)} className="mt-2 min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Institution</label>
              <input required value={institution} onChange={(e) => setInstitution(e.target.value)} className="mt-2 min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Course</label>
              <input required value={course} onChange={(e) => setCourse(e.target.value)} className="mt-2 min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Year</label>
              <input required value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className="mt-2 min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Comment</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-2 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 py-3 font-semibold outline-none" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="checkbox" 
                id="isAnonymous" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)} 
                className="h-5 w-5 border-2 border-[#06231f] rounded-none bg-white text-[#06231f] focus:ring-0 accent-[#06231f] cursor-pointer"
              />
              <label htmlFor="isAnonymous" className="text-sm font-black text-[#06231f] cursor-pointer select-none">
                Post rating anonymously
              </label>
            </div>
            <button className="w-full border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">
              Save Rating
            </button>
          </div>
        </form>

        <section className="space-y-6">
          <div className="border-4 border-[#06231f] bg-[#fffef1] p-6">
            <h3 className="text-xl font-black text-[#06231f]">Materials</h3>
            <div className="mt-4 divide-y-2 divide-[#06231f]/10">
              {materials.length ? materials.map((material) => (
                <a key={material.id} href={material.file_url || '#'} className="block py-3 font-semibold text-[#39564f]">
                  <span className="font-black text-[#06231f]">{material.title}</span>
                  <span className="block text-sm">{material.course} - {material.institution}</span>
                </a>
              )) : <p className="font-semibold text-[#557169]">No materials yet.</p>}
            </div>
          </div>

          <div className="border-4 border-[#06231f] bg-white p-6">
            <h3 className="text-xl font-black text-[#06231f]">Ratings</h3>
            <div className="mt-4 space-y-4">
              {ratings.length ? ratings.map((rating) => (
                <div key={rating.id} className="border-2 border-[#06231f]/20 bg-[#f2fbf3] p-4">
                  <p className="font-black text-[#06231f]">{rating.score}/5 - {rating.course}</p>
                  <p className="mt-1 text-sm font-semibold text-[#557169]">{rating.comment || 'No comment'} - {rating.user_name}</p>
                </div>
              )) : <p className="font-semibold text-[#557169]">No ratings yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
