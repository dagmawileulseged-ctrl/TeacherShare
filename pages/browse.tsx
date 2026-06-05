import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { universities } from '../components/UniversityLogos'

export default function BrowseDirectory() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<any[]>([])
  const [institution, setInstitution] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('recent')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  useEffect(() => {
    // Sync filters from URL query parameters if present
    if (router.isReady) {
      if (router.query.institution) setInstitution(String(router.query.institution))
      if (router.query.type) setType(String(router.query.type))
      if (router.query.sort) setSort(String(router.query.sort))
      if (router.query.page) setPage(Number(router.query.page))
    }
  }, [router.isReady, router.query])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (institution) params.append('institution', institution)
    if (type) params.append('type', type)
    if (sort) params.append('sort', sort)
    params.append('page', String(page))
    params.append('limit', String(limit))

    fetch(`/api/topics?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTopics(data.topics || [])
        setTotalCount(data.pagination?.total ?? 0)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [institution, type, sort, page])

  const totalPages = Math.ceil(totalCount / limit)

  function handleFilterChange(newInst: string, newType: string, newSort: string) {
    setInstitution(newInst)
    setType(newType)
    setSort(newSort)
    setPage(1)

    // Update query params in URL
    const query: any = {}
    if (newInst) query.institution = newInst
    if (newType) query.type = newType
    if (newSort) query.sort = newSort
    router.push({ pathname: '/browse', query }, undefined, { shallow: true })
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="border-4 border-[#06231f] bg-[#cfe8c9] p-6 shadow-[8px_8px_0_#06231f]">
        <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">Hub Directory</p>
        <h1 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f] sm:text-5xl">
          Browse Addis Materials & Ratings
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#24443d]">
          Filter and explore community shared lectures, exam packs, and instructor feedback across Addis Ababa universities.
        </p>
      </div>

      {/* Filter and Control Panel */}
      <div className="border-4 border-[#06231f] bg-white p-5 shadow-[8px_8px_0_#06231f]">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#06231f] mb-2">
              University / Institution
            </label>
            <select
              value={institution}
              onChange={(e) => handleFilterChange(e.target.value, type, sort)}
              className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold text-sm outline-none"
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni.name} value={uni.name}>
                  {uni.name} ({uni.shortName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#06231f] mb-2">
              Resource Type
            </label>
            <select
              value={type}
              onChange={(e) => handleFilterChange(institution, e.target.value, sort)}
              className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold text-sm outline-none"
            >
              <option value="">All Uploads & Ratings</option>
              <option value="material">Materials (Slides, Exams, Notes)</option>
              <option value="rating">Lecturer Ratings</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#06231f] mb-2">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => handleFilterChange(institution, type, e.target.value)}
              className="min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold text-sm outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Contents */}
      {loading ? (
        <div className="text-center font-black text-[#06231f] py-12">
          Loading Directory Feed...
        </div>
      ) : topics.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className={`border-2 border-[#06231f] p-5 shadow-[5px_5px_0_#06231f] flex flex-col justify-between transition-all ${
                topic.type === 'rating' ? 'bg-[#fffef1]' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`inline-block border border-[#06231f] px-2.5 py-0.5 text-xs font-black uppercase ${
                      topic.type === 'rating'
                        ? 'bg-[#f7f1bd] text-[#06231f]'
                        : 'bg-[#e3f4df] text-[#0d5b50]'
                    }`}
                  >
                    {topic.type === 'rating' ? 'Review' : 'Material'}
                  </span>
                  {topic.type === 'rating' && (
                    <div className="bg-[#06231f] text-white px-2.5 py-0.5 text-sm font-black shrink-0">
                      {topic.score}/5
                    </div>
                  )}
                </div>

                <h3 className="mt-3 text-xl font-black leading-snug text-[#06231f] hover:text-[#0d5b50]">
                  <Link href={`/topics/${topic.id}`}>{topic.title}</Link>
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#557169]">
                  {topic.course} - {topic.institution}
                </p>
                <p className="mt-2 text-xs font-bold text-[#557169]">
                  Lecturer:{' '}
                  <Link
                    href={`/teachers/${encodeURIComponent(topic.teacher_name)}`}
                    className="font-black text-[#0d5b50] hover:text-[#06231f]"
                  >
                    {topic.teacher_name}
                  </Link>
                  {topic.school_year ? ` (${topic.school_year})` : ''}
                </p>

                {topic.type === 'rating' && topic.comment && (
                  <p className="mt-3 bg-white border border-[#06231f]/10 p-3 text-xs font-semibold italic text-[#39564f] line-clamp-3">
                    &quot;{topic.comment}&quot;
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#06231f]/10 pt-3 text-xs text-[#557169]">
                <span>By {topic.author_name}</span>
                {topic.type === 'material' && topic.file_url ? (
                  <a
                    href={topic.file_url}
                    download
                    className="border-2 border-[#06231f] bg-[#06231f] px-3 py-1.5 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] transition"
                  >
                    Download
                  </a>
                ) : (
                  <Link
                    href={`/topics/${topic.id}`}
                    className="font-black text-[#0d5b50] hover:underline"
                  >
                    View Thread &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-4 border-dashed border-[#06231f] bg-white p-12 text-center">
          <p className="text-lg font-black text-[#06231f]">No materials or ratings match your filters.</p>
          <p className="text-sm font-semibold text-[#557169] mt-2">
            Try choosing a different university, category, or clear filters.
          </p>
          <button
            onClick={() => handleFilterChange('', '', 'recent')}
            className="mt-5 border-2 border-[#06231f] bg-[#06231f] px-6 py-2.5 text-sm font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] transition"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-4 border-[#06231f] bg-white p-4 shadow-[8px_8px_0_#06231f] mt-8">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
          >
            &larr; Previous
          </button>
          <span className="text-sm font-black text-[#06231f]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] disabled:opacity-40 disabled:hover:bg-[#06231f] disabled:hover:text-white transition cursor-pointer disabled:cursor-not-allowed"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
