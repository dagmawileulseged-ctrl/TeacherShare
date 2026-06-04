import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function TopicView(){
  const { query } = useRouter()
  const id = query.id as string | undefined
  const [topic, setTopic] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/topics/${id}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || 'Topic not found')
          return
        }
        setTopic(data.topic)
      })
      .catch(() => setError('Could not load topic'))
  }, [id])

  if (error) {
    return <div className="border-4 border-[#06231f] bg-white p-6 font-black text-[#06231f]">{error}</div>
  }

  if (!topic) return <div className="font-black text-[#06231f]">Loading topic...</div>

  return (
    <article className="space-y-6">
      <div className="border-4 border-[#06231f] bg-[#f2fbf3] p-6 shadow-[8px_8px_0_#06231f]">
        <p className="text-xs font-black uppercase tracking-wide text-[#0d5b50]">
          {topic.type === 'rating' ? 'Teacher rating topic' : 'Material topic'} - {topic.course} - {topic.institution}
        </p>
        <h2 className="display-ink mt-2 text-4xl font-black leading-none text-[#06231f]">{topic.title}</h2>
        <p className="mt-4 font-semibold text-[#557169]">
          Posted by {topic.author_name} for{' '}
          <Link href={`/teachers/${encodeURIComponent(topic.teacher_name)}`} className="font-black text-[#0d5b50] hover:text-[#06231f]">
            {topic.teacher_name}
          </Link>
          {topic.school_year ? ` - ${topic.school_year}` : ''}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="border-4 border-[#06231f] bg-white p-6">
          <h3 className="text-xl font-black text-[#06231f]">Topic note</h3>
          <p className="mt-4 whitespace-pre-wrap font-semibold leading-7 text-[#39564f]">
            {topic.body || 'No extra note was added for this topic.'}
          </p>
        </section>

        <aside className="border-4 border-[#06231f] bg-[#fffef1] p-6">
          <h3 className="text-xl font-black text-[#06231f]">{topic.type === 'rating' ? 'Rating' : 'Material'}</h3>
          {topic.type === 'rating' ? (
            <div className="mt-4">
              <p className="display-ink text-5xl font-black text-[#06231f]">{topic.score || 0}/5</p>
              <p className="mt-2 text-sm font-semibold text-[#557169]">{topic.course} - {topic.institution}</p>
            </div>
          ) : topic.file_url ? (
            <a href={topic.file_url} download className="mt-4 inline-flex border-2 border-[#06231f] bg-[#06231f] px-4 py-2 text-sm font-black text-white hover:bg-[#f7f1bd] hover:text-[#06231f]">
              Download file
            </a>
          ) : (
            <p className="mt-4 font-semibold text-[#557169]">No file attached.</p>
          )}
          {topic.file_name && <p className="mt-3 text-sm font-semibold text-[#557169]">{topic.file_name}</p>}
        </aside>
      </div>
    </article>
  )
}
