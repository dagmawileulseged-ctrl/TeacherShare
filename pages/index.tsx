import Link from 'next/link'
import { useEffect, useState } from 'react'
import UniversityLogos from '../components/UniversityLogos'

const materials = [
  ['Data Structures Midterm Pack', 'Dr. Bekele', 'AAU', '428 downloads'],
  ['Accounting I Chapter Notes', "Ms. Hana", "St. Mary's", '311 downloads'],
  ['Software Engineering Slides', 'Mr. Dawit', 'ASTU', '287 downloads'],
]

const teachers = [
  ['Dr. Bekele Tadesse', ['AAU', 'ASTU', 'Unity'], '4.7', '42 ratings'],
  ['Ms. Hana Alemu', ['SMU', 'Admas'], '4.6', '31 ratings'],
  ['Mr. Dawit Tesfaye', ['ASTU', 'HiLCoE'], '4.5', '27 ratings'],
]

export default function Home(){
  const [isAuth, setIsAuth] = useState(false)
  const [query, setQuery] = useState('')
  const [dbMaterials, setDbMaterials] = useState<any[]>([])
  const [dbTeachers, setDbTeachers] = useState<any[]>([])

  useEffect(() => {
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    setIsAuth(!!user && !!token)
    Promise.all([
      fetch('/api/materials').then((res) => res.json()),
      fetch('/api/teachers').then((res) => res.json()),
    ]).then(([materialsData, teachersData]) => {
      setDbMaterials(materialsData.materials || [])
      setDbTeachers(teachersData.teachers || [])
    }).catch(() => {
      setDbMaterials([])
      setDbTeachers([])
    })
  }, [])

  function handleSearch(e: React.FormEvent){
    e.preventDefault()
  }

  const materialRows = dbMaterials.length
    ? dbMaterials.slice(0, 6).map((material) => ({
      id: material.topic_id || material.id,
      title: material.title,
      teacher: material.teacher_name,
      college: material.institution,
      action: material.file_url ? 'Download' : 'Topic',
    }))
    : materials.map(([title, teacher, college, action]) => ({ id: null, title, teacher, college, action }))

  const teacherRows = dbTeachers.length
    ? dbTeachers.slice(0, 6).map((teacher) => ({
      name: teacher.name,
      colleges: String(teacher.institutions || '').split(',').filter(Boolean).slice(0, 3),
      rating: Number(teacher.rating || 0) ? teacher.rating : 'New',
      count: `${teacher.rating_count || 0} ratings`,
    }))
    : teachers.map(([name, colleges, rating, count]) => ({ name, colleges, rating, count }))

  if (isAuth) {
    return (
      <div className="rounded-none border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="display-ink text-3xl font-black text-[#06231f]">Recent Materials</h2>
          <Link href="/topics/create" className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]">Upload Material</Link>
        </div>
        <ul className="space-y-4">
          {dbMaterials.length ? dbMaterials.slice(0, 6).map((material) => (
            <li key={material.id} className="border-2 border-[#06231f]/20 bg-white p-4">
              <Link href={`/topics/${material.topic_id || material.id}`} className="font-black text-[#06231f] hover:text-[#0d5b50]">{material.title}</Link>
              <p className="mt-1 text-sm font-semibold text-[#557169]">{material.course} - {material.teacher_name} - {material.institution}</p>
            </li>
          )) : (
            <li className="border-2 border-[#06231f]/20 bg-white p-4">No materials yet - upload one to get started.</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-0 bg-[#ecf6f1]">
      <section className="relative overflow-hidden border-4 border-[#06231f] bg-[#cfe8c9] px-5 py-12 shadow-[10px_10px_0_#06231f] sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,#85bfa0)]" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-52 w-52 rounded-t-full bg-[#24584f]/30" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-t-full bg-[#24584f]/30" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 inline-flex border-2 border-[#06231f] bg-[#fffef1] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#06231f]">
            Search materials and teacher ratings
          </div>
          <h1 className="display-ink mx-auto max-w-4xl text-5xl font-black leading-[0.9] text-[#06231f] sm:text-7xl">
            Find courses & rate lecturers in Addis
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-[#24443d]">
            Part-time teachers work across AAU, ASTU, Unity, HiLCoE, SMU, ACT, BITS, and more. Search once and see materials, ratings, and colleges together.
          </p>

          <form id="search" onSubmit={handleSearch} className="ink-panel mx-auto mt-8 max-w-3xl bg-white p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-12 flex-1 border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none placeholder:text-[#5c756d]"
                placeholder="Search by teacher name, course, or college..."
              />
              <button className="border-2 border-[#06231f] bg-[#06231f] px-7 py-3 text-sm font-black uppercase text-white transition hover:bg-[#f7f1bd] hover:text-[#06231f]">
                Search
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#0d5b50]">
              {['Data Structures', 'Dr. Bekele', 'AAU', 'Software Engineering'].map((term) => (
                <a key={term} href="#search" className="border-2 border-[#06231f]/20 bg-[#e3f4df] px-3 py-1.5 hover:border-[#06231f]">
                  {term}
                </a>
              ))}
            </div>
          </form>
        </div>
      </section>

      <section className="grid border-x-4 border-[#06231f] bg-[#f7fff7] md:grid-cols-3">
        {[
          ['Materials Shared', '1,500+'],
          ['Part-time Teachers', '300+'],
          ['Students This Month', '500+'],
        ].map(([label, value]) => (
          <div key={label} className="border-b-4 border-[#06231f] p-6 text-center md:border-r-4 md:last:border-r-0">
            <p className="display-ink text-4xl font-black text-[#06231f]">{value}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#0d5b50]">{label}</p>
          </div>
        ))}
      </section>

      <UniversityLogos />

      <section className="relative border-x-4 border-[#06231f] bg-[#e9f6f1] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="ink-panel bg-white p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Unique value</p>
            <h2 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">We connect the dots across colleges</h2>
            <div className="mt-6 border-2 border-dashed border-[#06231f] bg-[#fffef1] p-5">
              <p className="text-2xl font-black text-[#06231f]">Dr. Bekele</p>
              <p className="mt-3 font-semibold text-[#37564f]">Teaches at: AAU (M,W) - ASTU (T,Th) - Unity (F)</p>
              <p className="mt-4 font-black text-[#06231f]">Combined Rating: 4.7 from 42 students across all colleges</p>
              <a href="#teachers" className="mt-5 inline-flex border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-sm font-black text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">See Full Profile</a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-x-4 border-[#06231f] bg-[#edf7f2] px-5 py-16 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Trending</p>
            <h2 className="display-ink text-4xl font-black leading-none text-[#06231f]">What students are using this week</h2>
          </div>
          <Link href="/topics/create" className="w-fit border-2 border-[#06231f] bg-[#f7f1bd] px-4 py-2 text-sm font-black text-[#06231f] hover:bg-[#06231f] hover:text-white">Upload Material</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="ink-panel bg-white p-5">
            <h3 className="text-xl font-black text-[#06231f]">Most downloaded materials</h3>
            <div className="mt-4 divide-y-2 divide-[#06231f]/10">
              {materialRows.slice(0, 3).map((material) => (
                <Link key={`${material.title}-${material.teacher}`} href={material.id ? `/topics/${material.id}` : '#search'} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-black text-[#06231f]">{material.title}</p>
                    <p className="mt-1 text-sm font-semibold text-[#557169]">{material.teacher} - {material.college}</p>
                  </div>
                  <span className="border-2 border-[#06231f] bg-[#e3f4df] px-3 py-1 text-xs font-black text-[#06231f]">{material.action}</span>
                </Link>
              ))}
            </div>
          </div>

          <div id="teachers" className="ink-panel bg-[#fffef1] p-5">
            <h3 className="text-xl font-black text-[#06231f]">Top rated part-time teachers</h3>
            <div className="mt-4 space-y-4">
              {teacherRows.slice(0, 3).map((teacher) => (
                <Link key={teacher.name as string} href={`/teachers/${encodeURIComponent(String(teacher.name))}`} className="block border-2 border-[#06231f] bg-white p-4 transition hover:bg-[#e3f4df]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#06231f]">{teacher.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(teacher.colleges as string[]).map((college) => (
                          <span key={college} className="rounded-full bg-[#06231f] px-2.5 py-1 text-xs font-black text-white">{college}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#06231f]">{teacher.rating}</p>
                      <p className="text-xs font-semibold text-[#557169]">{teacher.count}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="border-x-4 border-[#06231f] bg-[#fffef1] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">How it works</p>
          <h2 className="display-ink text-4xl font-black leading-none text-[#06231f]">Search first. Contribute when ready.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Search for your course or teacher', 'No login'],
            ['2', 'Download materials instantly', 'No login'],
            ['3', 'Rate & upload to help others', 'Login required'],
          ].map(([step, action, login]) => (
            <div key={step} className="border-2 border-[#06231f] bg-white p-5 shadow-[5px_5px_0_#06231f]">
              <p className="display-ink text-4xl font-black text-[#0d5b50]">{step}</p>
              <h3 className="mt-3 font-black text-[#06231f]">{action}</h3>
              <p className="mt-2 text-sm font-semibold text-[#557169]">{login}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-4 border-[#06231f] bg-[#06231f] p-7 text-[#edf7e7]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="display-ink text-4xl font-black leading-none">Help your classmates find better materials</h2>
            <p className="mt-3 text-sm font-semibold text-[#bdd5ca]">Create an account to upload files, rate teachers, and improve the Addis student search experience.</p>
          </div>
          <Link href="/auth/signup" className="inline-flex shrink-0 justify-center border-2 border-[#edf7e7] bg-[#edf7e7] px-5 py-3 text-sm font-black text-[#06231f] transition hover:bg-transparent hover:text-[#edf7e7]">Sign Up</Link>
        </div>
      </section>

      <footer className="bg-[#06231f] p-8 text-sm text-[#bdd5ca]">
        <div className="grid gap-6 border-2 border-[#edf7e7]/20 bg-[#0a332e] p-6 md:grid-cols-3">
          <div>
            <p className="font-black uppercase text-[#edf7e7]">Addis Course Hub</p>
            <p className="mt-2 leading-6">Materials are user-uploaded. Not affiliated with any university.</p>
          </div>
          <div>
            <p className="font-black text-[#edf7e7]">Quick Links</p>
            <div className="mt-2 grid gap-1">
              <a href="#colleges">Browse Colleges</a>
              <a href="#teachers">Top Teachers</a>
              <a href="#search">Recent Materials</a>
              <a href="#about">How It Works</a>
            </div>
          </div>
          <div>
            <p className="font-black text-[#edf7e7]">Contact & Legal</p>
            <div className="mt-2 grid gap-1">
              <a href="#about">Telegram Group</a>
              <a href="#about">Report Issue</a>
              <a href="#about">Terms of Use</a>
              <a href="#about">DMCA/Copyright</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
