import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { universities } from '../components/UniversityLogos'

export default function SearchResults() {
  const router = useRouter()
  const { q } = router.query
  const query = typeof q === 'string' ? q.trim() : ''

  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [error, setError] = useState('')

  // Pagination states
  const [teachersPage, setTeachersPage] = useState(1)
  const [teachersTotal, setTeachersTotal] = useState(0)
  const teachersLimit = 10

  const [topicsPage, setTopicsPage] = useState(1)
  const [topicsTotal, setTopicsTotal] = useState(0)
  const topicsLimit = 10

  const loading = (loadingTeachers && teachers.length === 0) || (loadingTopics && topics.length === 0)

  // Identify if query matches any university
  const matchedUni = universities.find(
    (uni) =>
      uni.shortName.toLowerCase() === query.toLowerCase() ||
      uni.name.toLowerCase() === query.toLowerCase() ||
      (query.toLowerCase().includes(uni.shortName.toLowerCase()) && uni.shortName.length > 2)
  )

  // Reset pagination and results when query changes
  useEffect(() => {
    if (!query) return
    setTeachers([])
    setTopics([])
    setTeachersPage(1)
    setTopicsPage(1)
  }, [query])

  // Fetch teachers
  useEffect(() => {
    if (!query) return

    setLoadingTeachers(true)
    setError('')

    fetch(`/api/teachers?search=${encodeURIComponent(query)}&page=${teachersPage}&limit=${teachersLimit}`)
      .then((res) => res.json())
      .then((data) => {
        setTeachers(data.teachers || [])
        setTeachersTotal(data.pagination?.total ?? 0)
      })
      .catch((err) => {
        console.error(err)
        setError('Could not retrieve teacher search results. Please try again.')
      })
      .finally(() => {
        setLoadingTeachers(false)
      })
  }, [query, teachersPage])

  // Fetch topics (materials/ratings)
  useEffect(() => {
    if (!query) return

    setLoadingTopics(true)
    setError('')

    fetch(`/api/topics?search=${encodeURIComponent(query)}&page=${topicsPage}&limit=${topicsLimit}`)
      .then((res) => res.json())
      .then((data) => {
        setTopics(data.topics || [])
        setTopicsTotal(data.pagination?.total ?? 0)
      })
      .catch((err) => {
        console.error(err)
        setError('Could not retrieve topics search results. Please try again.')
      })
      .finally(() => {
        setLoadingTopics(false)
      })
  }, [query, topicsPage])

  if (!query) {
    return (
      <div className="border-4 border-[#06231f] bg-[#fffef1] p-8 text-center shadow-[8px_8px_0_#06231f]">
        <h2 className="display-ink text-3xl font-black text-[#06231f]">No query specified</h2>
        <p className="mt-2 text-sm font-semibold text-[#557169]">Please use the search bar on the home page or dashboard to search.</p>
        <Link href="/" className="mt-5 inline-flex border-2 border-[#06231f] bg-[#06231f] px-5 py-2.5 text-sm font-black text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Bar Block */}
      <div className="border-4 border-[#06231f] bg-white p-5 shadow-[8px_8px_0_#06231f]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const val = (e.currentTarget.elements.namedItem('searchQuery') as HTMLInputElement).value
            if (val.trim()) {
              router.push(`/search?q=${encodeURIComponent(val.trim())}`)
            }
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="searchQuery"
            defaultValue={query}
            className="min-h-12 flex-1 border-2 border-[#06231f] bg-[#fbfff9] px-4 text-base font-semibold text-[#06231f] outline-none"
            placeholder="Search by teacher, course, or college..."
          />
          <button className="border-2 border-[#06231f] bg-[#06231f] px-8 py-3 text-sm font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center font-black text-[#06231f] py-12">
          Searching Addis Course Hub...
        </div>
      ) : error ? (
        <div className="border-4 border-red-700 bg-red-50 p-6 font-black text-red-700">{error}</div>
      ) : (
        <>
          {/* Matched University Showcase */}
          {matchedUni && (
            <div className="relative border-4 border-[#06231f] bg-[#fffef1] p-6 shadow-[8px_8px_0_#06231f]">
              <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${matchedUni.accent}`} />
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center border-3 border-[#06231f] bg-white text-lg font-black text-[#06231f]">
                  {matchedUni.logo ? (
                    <img src={matchedUni.logo} alt={matchedUni.name} className="max-h-14 max-w-14 object-contain" />
                  ) : (
                    matchedUni.shortName
                  )}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">University Hub Page</p>
                  <h2 className="display-ink mt-1 text-3xl font-black text-[#06231f]">{matchedUni.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-[#557169]">
                    Lecturers, course guides, and study materials associated with {matchedUni.shortName}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Teachers */}
            <div className="space-y-6">
              <div className="border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
                <h3 className="display-ink text-2xl font-black text-[#06231f]">
                  Teachers ({teachersTotal})
                  {loadingTeachers && (
                    <span className="text-xs font-bold animate-pulse text-[#0d5b50] ml-2">Loading...</span>
                  )}
                </h3>
                <p className="text-sm font-semibold text-[#557169]">
                  Instructors matches for &quot;{query}&quot;
                </p>
              </div>

              {teachers.length > 0 ? (
                <div className="space-y-4">
                  {teachers.map((teacher) => {
                    const instList = teacher.institutions
                      ? String(teacher.institutions).split(',').filter(Boolean)
                      : []
                    return (
                      <div
                        key={teacher.name}
                        className="border-2 border-[#06231f] bg-white p-5 shadow-[4px_4px_0_#06231f] transition hover:bg-[#fffef1]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link
                              href={`/teachers/${encodeURIComponent(teacher.name)}`}
                              className="text-xl font-black text-[#06231f] hover:text-[#0d5b50]"
                            >
                              {teacher.name}
                            </Link>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {instList.map((inst: string) => (
                                <span
                                  key={inst}
                                  className="rounded-full bg-[#06231f] px-2.5 py-0.5 text-xs font-black text-white"
                                >
                                  {inst.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="display-ink block text-2xl font-black text-[#06231f]">
                              {Number(teacher.rating) ? teacher.rating : 'New'}
                            </span>
                            <span className="text-xs font-bold text-[#557169]">
                              {teacher.rating_count || 0} ratings
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-[#06231f]/10 pt-3">
                          <Link
                            href={`/teachers/${encodeURIComponent(teacher.name)}`}
                            className="text-sm font-black text-[#0d5b50] hover:text-[#06231f]"
                          >
                            View Full Ratings &rarr;
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#06231f] bg-white p-6 text-center font-semibold text-[#557169]">
                  No instructors found matching &quot;{query}&quot;.
                </div>
              )}

              {/* Teachers Pagination Controls */}
              {teachersTotal > teachersLimit && (
                <div className="flex items-center justify-between border-2 border-[#06231f] bg-white p-3 shadow-[4px_4px_0_#06231f] mt-4">
                  <button
                    disabled={teachersPage === 1 || loadingTeachers}
                    onClick={() => setTeachersPage((p) => Math.max(p - 1, 1))}
                    className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-sm font-black text-[#06231f]">
                    Page {teachersPage} of {Math.ceil(teachersTotal / teachersLimit)}
                  </span>
                  <button
                    disabled={teachersPage * teachersLimit >= teachersTotal || loadingTeachers}
                    onClick={() => setTeachersPage((p) => p + 1)}
                    className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Topics & Materials */}
            <div className="space-y-6">
              <div className="border-4 border-[#06231f] bg-[#fffef1] p-6 shadow-[8px_8px_0_#06231f]">
                <h3 className="display-ink text-2xl font-black text-[#06231f]">
                  Materials & Ratings ({topicsTotal})
                  {loadingTopics && (
                    <span className="text-xs font-bold animate-pulse text-[#0d5b50] ml-2">Loading...</span>
                  )}
                </h3>
                <p className="text-sm font-semibold text-[#557169]">
                  Files and reviews linked to &quot;{query}&quot;
                </p>
              </div>

              {topics.length > 0 ? (
                <div className="space-y-4">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="border-2 border-[#06231f] bg-white p-5 shadow-[4px_4px_0_#06231f]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block border border-[#06231f] bg-[#e3f4df] px-2 py-0.5 text-xs font-black uppercase text-[#0d5b50]">
                            {topic.type === 'rating' ? 'Review' : 'Material'}
                          </span>
                          <h4 className="mt-2 text-lg font-black leading-snug text-[#06231f]">
                            <Link href={`/topics/${topic.id}`} className="hover:text-[#0d5b50]">
                              {topic.title}
                            </Link>
                          </h4>
                          <p className="mt-1 text-sm font-semibold text-[#557169]">
                            {topic.course} - {topic.institution}
                          </p>
                          <p className="mt-1 text-xs text-[#557169]">
                            Teacher:{' '}
                            <Link
                              href={`/teachers/${encodeURIComponent(topic.teacher_name)}`}
                              className="font-black text-[#0d5b50]"
                            >
                              {topic.teacher_name}
                            </Link>
                          </p>
                        </div>
                        {topic.type === 'rating' && (
                          <div className="bg-[#06231f] text-white p-2 font-black text-center min-w-10">
                            {topic.score}/5
                          </div>
                        )}
                      </div>

                      {topic.type === 'rating' && topic.comment && (
                        <p className="mt-3 bg-[#f2fbf3] p-3 text-sm font-semibold italic text-[#39564f]">
                          &quot;{topic.comment}&quot;
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-[#06231f]/10 pt-3 text-xs font-bold text-[#557169]">
                        <span>By {topic.author_name}</span>
                        {topic.type === 'material' && topic.file_url ? (
                          <a
                            href={topic.file_url}
                            download
                            className="border border-[#06231f] bg-[#06231f] px-3 py-1 text-xs font-black text-white hover:bg-[#f7f1bd] hover:text-[#06231f]"
                          >
                            Download
                          </a>
                        ) : (
                          <Link href={`/topics/${topic.id}`} className="text-[#0d5b50] font-black">
                            View Thread &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#06231f] bg-white p-6 text-center font-semibold text-[#557169]">
                  No files or rating topics found matching &quot;{query}&quot;.
                </div>
              )}

              {/* Topics Pagination Controls */}
              {topicsTotal > topicsLimit && (
                <div className="flex items-center justify-between border-2 border-[#06231f] bg-white p-3 shadow-[4px_4px_0_#06231f] mt-4">
                  <button
                    disabled={topicsPage === 1 || loadingTopics}
                    onClick={() => setTopicsPage((p) => Math.max(p - 1, 1))}
                    className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-sm font-black text-[#06231f]">
                    Page {topicsPage} of {Math.ceil(topicsTotal / topicsLimit)}
                  </span>
                  <button
                    disabled={topicsPage * topicsLimit >= topicsTotal || loadingTopics}
                    onClick={() => setTopicsPage((p) => p + 1)}
                    className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
