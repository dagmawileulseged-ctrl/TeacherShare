import { useState } from 'react'
import { useRouter } from 'next/router'

type Mode = 'material' | 'rating'

export default function TopicForm(){
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('material')
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [teacher, setTeacher] = useState('')
  const [schoolYear, setSchoolYear] = useState('')
  const [score, setScore] = useState('5')
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function fileToDataUrl(selectedFile: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Could not read file'))
      reader.readAsDataURL(selectedFile)
    })
  }

  function checkAuth() {
    const user = localStorage.getItem('user')
    if (!user) {
      setError('Please log in again before submitting.')
      router.push('/auth/login')
      return false
    }
    return true
  }

  async function submitMaterial(e: React.FormEvent){
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (!checkAuth()) return

      const payload: any = { title, institution, course, teacher, body }

      if (file) {
        if (file.size > 25 * 1024 * 1024) {
          setError('Please upload a file smaller than 25 MB.')
          return
        }

        payload.file = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          dataUrl: await fileToDataUrl(file),
        }
      }

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('user')
          setError('Session expired. Please log in again.')
          router.push('/auth/login')
          return
        }
        setError(data.error || 'Could not upload material')
        return
      }

      router.push(`/topics/${data.topicId}`)
    } catch (error: any) {
      setError(error?.message || 'Could not upload material')
    } finally {
      setIsSaving(false)
    }
  }

  async function submitRating(e: React.FormEvent){
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (!checkAuth()) return

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teacher, institution, course, schoolYear, score, comment: body }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('user')
          setError('Session expired. Please log in again.')
          router.push('/auth/login')
          return
        }
        setError(data.error || 'Could not create rating topic')
        return
      }

      router.push(`/topics/${data.topicId}`)
    } catch (error: any) {
      setError(error?.message || 'Could not create rating topic')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setMode('material')
            setError('')
          }}
          className={`border-2 border-[#06231f] px-5 py-4 text-left font-black transition ${mode === 'material' ? 'bg-[#06231f] text-white' : 'bg-white text-[#06231f] hover:bg-[#f7f1bd]'}`}
        >
          Upload Material
          <span className="mt-1 block text-xs font-semibold opacity-80">Course files, notes, slides, exam packs</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('rating')
            setError('')
          }}
          className={`border-2 border-[#06231f] px-5 py-4 text-left font-black transition ${mode === 'rating' ? 'bg-[#06231f] text-white' : 'bg-white text-[#06231f] hover:bg-[#f7f1bd]'}`}
        >
          Rate Teacher
          <span className="mt-1 block text-xs font-semibold opacity-80">Create a teacher-rating topic</span>
        </button>
      </div>

      {mode === 'material' ? (
        <form onSubmit={submitMaterial} className="ink-panel space-y-5 bg-white p-6">
          {error && <div className="border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-black text-[#06231f]">Material title</label>
            <input required value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-black text-[#06231f]">School</label>
              <input required value={institution} onChange={e=>setInstitution(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Course name</label>
              <input required value={course} onChange={e=>setCourse(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Teacher (optional)</label>
              <input value={teacher} onChange={e=>setTeacher(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-[#06231f]">Material note</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} className="mt-2 block w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 py-3 font-semibold outline-none focus:bg-[#fffef1]" />
          </div>
          <div>
            <label className="block text-sm font-black text-[#06231f]">Material file</label>
            <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full border-2 border-[#06231f] bg-[#fbfff9] p-3 font-semibold" />
            <p className="mt-2 text-xs font-semibold text-[#557169]">Maximum file size: 25 MB.</p>
          </div>
          <button disabled={isSaving} className="border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-60">
            {isSaving ? 'Uploading...' : 'Upload Material'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitRating} className="ink-panel space-y-5 bg-[#fffef1] p-6">
          {error && <div className="border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-black text-[#06231f]">Teacher name</label>
              <input required value={teacher} onChange={e=>setTeacher(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-white px-4 font-semibold outline-none focus:bg-[#fbfff9]" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Course name</label>
              <input required value={course} onChange={e=>setCourse(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-white px-4 font-semibold outline-none focus:bg-[#fbfff9]" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">Year</label>
              <input required value={schoolYear} onChange={e=>setSchoolYear(e.target.value)} placeholder="2026, 2nd year, or batch year" className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-white px-4 font-semibold outline-none focus:bg-[#fbfff9]" />
            </div>
            <div>
              <label className="block text-sm font-black text-[#06231f]">School</label>
              <input required value={institution} onChange={e=>setInstitution(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-white px-4 font-semibold outline-none focus:bg-[#fbfff9]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-[#06231f]">Rating</label>
            <select value={score} onChange={e=>setScore(e.target.value)} className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-white px-4 font-semibold outline-none">
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-[#06231f]">Topic details</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} className="mt-2 block w-full border-2 border-[#06231f] bg-white px-4 py-3 font-semibold outline-none focus:bg-[#fbfff9]" />
          </div>
          <button disabled={isSaving} className="border-2 border-[#06231f] bg-[#06231f] px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-60">
            {isSaving ? 'Creating...' : 'Create Rating Topic'}
          </button>
        </form>
      )}
    </div>
  )
}
