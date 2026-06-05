import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import UniversityLogos from '../components/UniversityLogos'



export default function Home(){
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [dbMaterials, setDbMaterials] = useState<any[]>([])
  const [dbTeachers, setDbTeachers] = useState<any[]>([])
  const [dbRatings, setDbRatings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'materials' | 'ratings'>('materials')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    setIsAuth(!!storedUser)
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    Promise.all([
      fetch('/api/materials?limit=6').then((res) => res.json()),
      fetch('/api/teachers?limit=6').then((res) => res.json()),
      fetch('/api/ratings?limit=6').then((res) => res.json()),
    ]).then(([materialsData, teachersData, ratingsData]) => {
      setDbMaterials(materialsData.materials || [])
      setDbTeachers(teachersData.teachers || [])
      setDbRatings(ratingsData.ratings || [])
    }).catch(() => {
      setDbMaterials([])
      setDbTeachers([])
      setDbRatings([])
    })
  }, [])

  function handleSearch(e: React.FormEvent){
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="space-y-0 bg-[#ecf6f1]">
      <section className="relative overflow-hidden border-4 border-[#06231f] bg-[#cfe8c9] px-5 py-12 shadow-[10px_10px_0_#06231f] sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,#85bfa0)]" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-52 w-52 rounded-t-full bg-[#24584f]/30" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-t-full bg-[#24584f]/30" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 inline-flex border-2 border-[#06231f] bg-[#fffef1] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#06231f]">
            {isAuth ? `Welcome back, ${user?.name || 'Student'}!` : 'Search materials and teacher ratings'}
          </div>
          <h1 className="display-ink mx-auto max-w-4xl text-5xl font-black leading-[0.9] text-[#06231f] sm:text-7xl">
            Find courses & rate lecturers in Addis
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-[#24443d]">
            {isAuth
              ? 'Browse student uploads, find lecture ratings, and search across AAU, ASTU, Unity, HiLCoE, SMU, ACT, BITS, and more.'
              : 'Part-time teachers work across AAU, ASTU, Unity, HiLCoE, SMU, ACT, BITS, and more. Search once and see materials, ratings, and colleges together.'}
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
                <button key={term} type="button" onClick={() => { router.push(`/search?q=${encodeURIComponent(term)}`) }} className="border-2 border-[#06231f]/20 bg-[#e3f4df] px-3 py-1.5 hover:border-[#06231f] cursor-pointer">
                  {term}
                </button>
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

      {isAuth && (
        <section className="relative border-x-4 border-[#06231f] bg-[#f2fbf3] px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="ink-panel bg-white p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Community Activity</p>
                  <h2 className="display-ink text-3xl font-black text-[#06231f]">Latest Uploads &amp; Ratings</h2>
                  <p className="mt-1 text-sm font-semibold text-[#557169]">See what other students have shared recently.</p>
                </div>
                <div className="flex border-2 border-[#06231f] bg-[#edf7f2] p-1 h-fit">
                  <button 
                    onClick={() => setActiveTab('materials')} 
                    className={`px-4 py-2 text-xs font-black uppercase transition-all ${activeTab === 'materials' ? 'bg-[#06231f] text-white' : 'text-[#06231f] hover:bg-[#cce8c8]'}`}
                  >
                    Latest Uploads
                  </button>
                  <button 
                    onClick={() => setActiveTab('ratings')} 
                    className={`px-4 py-2 text-xs font-black uppercase transition-all ${activeTab === 'ratings' ? 'bg-[#06231f] text-white' : 'text-[#06231f] hover:bg-[#cce8c8]'}`}
                  >
                    Latest Ratings
                  </button>
                </div>
              </div>

              {activeTab === 'materials' ? (
                <div className="space-y-4">
                  {dbMaterials.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {dbMaterials.slice(0, 6).map((material) => (
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
                    <p className="font-semibold text-[#557169] text-center py-6">No uploads from other users yet.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {dbRatings.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {dbRatings.slice(0, 6).map((rating) => (
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
                    <p className="font-semibold text-[#557169] text-center py-6">No teacher ratings yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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
            {dbMaterials.length > 0 ? (
              <div className="mt-4 divide-y-2 divide-[#06231f]/10">
                {dbMaterials.slice(0, 3).map((material) => (
                  <Link key={material.id} href={`/topics/${material.topic_id || material.id}`} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-black text-[#06231f]">{material.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[#557169]">{material.teacher_name} - {material.institution}</p>
                    </div>
                    <span className="border-2 border-[#06231f] bg-[#e3f4df] px-3 py-1 text-xs font-black text-[#06231f]">
                      {material.file_url ? 'Download' : 'Topic'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-[#557169] py-6 text-center">
                No study materials shared yet.
              </p>
            )}
          </div>

          <div id="teachers" className="ink-panel bg-[#fffef1] p-5">
            <h3 className="text-xl font-black text-[#06231f]">Top rated part-time teachers</h3>
            {dbTeachers.length > 0 ? (
              <div className="mt-4 space-y-4">
                {dbTeachers.slice(0, 3).map((teacher) => {
                  const colleges = String(teacher.institutions || '').split(',').filter(Boolean).slice(0, 3)
                  return (
                    <Link key={teacher.name} href={`/teachers/${encodeURIComponent(teacher.name)}`} className="block border-2 border-[#06231f] bg-white p-4 transition hover:bg-[#e3f4df]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#06231f]">{teacher.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {colleges.map((college) => (
                              <span key={college} className="rounded-full bg-[#06231f] px-2.5 py-1 text-xs font-black text-white">{college}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-[#06231f]">
                            {Number(teacher.rating) ? teacher.rating : 'New'}
                          </p>
                          <p className="text-xs font-semibold text-[#557169]">
                            {teacher.rating_count || 0} ratings
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-[#557169] py-6 text-center">
                No instructors rated yet.
              </p>
            )}
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
