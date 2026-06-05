import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function TopicView() {
  const router = useRouter()
  const id = router.query.id as string | undefined
  
  const [user, setUser] = useState<any>(null)
  const [topic, setTopic] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Comments input states
  const [newComment, setNewComment] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [editCommentId, setEditCommentId] = useState<number | null>(null)
  const [editCommentBody, setEditCommentBody] = useState('')

  // Topic edit form states
  const [editTopicMode, setEditTopicMode] = useState(false)
  const [topicForm, setTopicForm] = useState({
    title: '',
    body: '',
    course: '',
    institution: '',
    teacher_name: '',
    school_year: '',
    score: '5'
  })

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Load topic and comments
  function loadTopicDetails() {
    if (!id) return
    fetch(`/api/topics/${id}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || 'Topic not found')
          return
        }
        setTopic(data.topic)
        setComments(data.comments || [])
        // Initialize topic edit form fields
        setTopicForm({
          title: data.topic.title || '',
          body: data.topic.body || data.topic.comment || '',
          course: data.topic.course || '',
          institution: data.topic.institution || '',
          teacher_name: data.topic.teacher_name || '',
          school_year: data.topic.school_year || '',
          score: String(data.topic.score || '5')
        })
      })
      .catch(() => setError('Could not load topic'))
  }

  useEffect(() => {
    loadTopicDetails()
  }, [id])

  // Submit comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!newComment.trim()) return

    setIsCommenting(true)
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Could not post comment')
      }

      setNewComment('')
      setComments((prev) => [...prev, data.comment])
      setSuccess('Comment posted successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCommenting(false)
    }
  }

  // Edit comment
  async function handleEditComment(commentId: number) {
    setError('')
    setSuccess('')
    if (!editCommentBody.trim()) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editCommentBody })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Could not edit comment')
      }

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: data.comment.body } : c))
      )
      setEditCommentId(null)
      setEditCommentBody('')
      setSuccess('Comment updated.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Delete comment
  async function handleDeleteComment(commentId: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not delete comment')
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setSuccess('Comment deleted.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Edit Topic
  async function handleEditTopic(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicForm)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not update topic')
      }

      setEditTopicMode(false)
      loadTopicDetails()
      setSuccess('Topic updated successfully!')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Delete Topic
  async function handleDeleteTopic() {
    if (!confirm('Are you sure you want to delete this post? This will delete the topic, comments, and associated files/ratings permanently.')) return
    setError('')

    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Could not delete topic')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (error && !topic) {
    return <div className="border-4 border-red-700 bg-red-50 p-6 font-black text-red-700">{error}</div>
  }

  if (!topic) return <div className="font-black text-[#06231f]">Loading topic...</div>

  const isAuthor = user && user.id === topic.author_id

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && <div className="border-2 border-red-700 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
      {success && <div className="border-2 border-[#0d5b50] bg-[#e3f4df] p-3 text-sm font-black text-[#0d5b50]">{success}</div>}

      {/* Main Topic Header */}
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

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        
        {/* Left Column: Details & Editing */}
        <section className="space-y-6">
          {editTopicMode ? (
            <form onSubmit={handleEditTopic} className="border-4 border-[#06231f] bg-white p-6 space-y-5">
              <h3 className="text-xl font-black text-[#06231f]">Edit Post</h3>
              
              <div>
                <label className="block text-sm font-black text-[#06231f]">Title</label>
                <input
                  required
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-black text-[#06231f]">School</label>
                  <input
                    required
                    value={topicForm.institution}
                    onChange={(e) => setTopicForm({ ...topicForm, institution: e.target.value })}
                    className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[#06231f]">Course Name</label>
                  <input
                    required
                    value={topicForm.course}
                    onChange={(e) => setTopicForm({ ...topicForm, course: e.target.value })}
                    className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none focus:bg-[#fffef1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[#06231f]">Lecturer Name</label>
                  <input
                    value={topicForm.teacher_name}
                    onChange={(e) => setTopicForm({ ...topicForm, teacher_name: e.target.value })}
                    className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-[#06231f]">Batch / Year</label>
                  <input
                    value={topicForm.school_year}
                    onChange={(e) => setTopicForm({ ...topicForm, school_year: e.target.value })}
                    className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none"
                  />
                </div>
              </div>

              {topic.type === 'rating' && (
                <div>
                  <label className="block text-sm font-black text-[#06231f]">Score</label>
                  <select
                    value={topicForm.score}
                    onChange={(e) => setTopicForm({ ...topicForm, score: e.target.value })}
                    className="mt-2 block min-h-12 w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 font-semibold outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((scoreVal) => (
                      <option key={scoreVal} value={scoreVal}>{scoreVal}/5</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-black text-[#06231f]">Notes / Body Details</label>
                <textarea
                  value={topicForm.body}
                  onChange={(e) => setTopicForm({ ...topicForm, body: e.target.value })}
                  rows={6}
                  className="mt-2 block w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 py-3 font-semibold outline-none focus:bg-[#fffef1]"
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="border-2 border-[#06231f] bg-[#06231f] px-5 py-2.5 text-xs font-black uppercase text-white hover:bg-[#e3f4df] hover:text-[#06231f] transition">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditTopicMode(false)}
                  className="border-2 border-[#06231f] bg-white px-5 py-2.5 text-xs font-black uppercase text-[#06231f] hover:bg-[#ffebeb] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="border-4 border-[#06231f] bg-white p-6 relative">
              <h3 className="text-xl font-black text-[#06231f]">Details</h3>
              <p className="mt-4 whitespace-pre-wrap font-semibold leading-7 text-[#39564f]">
                {topic.body || topic.comment || 'No extra note was added for this topic.'}
              </p>
              
              {/* Creator Edit/Delete actions */}
              {isAuthor && (
                <div className="mt-6 border-t-2 border-[#06231f]/10 pt-4 flex gap-3">
                  <button
                    onClick={() => setEditTopicMode(true)}
                    className="border-2 border-[#06231f] bg-[#f7f1bd] px-4 py-2 text-xs font-black uppercase text-[#06231f] hover:bg-[#06231f] hover:text-white transition"
                  >
                    Edit Post
                  </button>
                  <button
                    onClick={handleDeleteTopic}
                    className="border-2 border-[#06231f] bg-red-500 px-4 py-2 text-xs font-black uppercase text-white hover:bg-red-700 transition"
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments/Replies Feed */}
          <div className="border-4 border-[#06231f] bg-white p-6 space-y-6">
            <h3 className="text-2xl font-black text-[#06231f]">Discussion ({comments.length})</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-2 border-[#06231f]/20 bg-[#f8fdfa] p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs text-[#557169] mb-2 font-bold">
                        <span>{comment.author_name}</span>
                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>

                      {editCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentBody}
                            onChange={(e) => setEditCommentBody(e.target.value)}
                            rows={3}
                            className="w-full border-2 border-[#06231f] bg-[#fbfff9] px-3 py-2 font-semibold text-sm outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="border-2 border-[#06231f] bg-[#06231f] px-3 py-1.5 text-xs font-black text-white hover:bg-[#e3f4df] hover:text-[#06231f]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditCommentId(null)
                                setEditCommentBody('')
                              }}
                              className="border border-[#06231f]/40 bg-white px-3 py-1.5 text-xs font-black text-[#06231f]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-[#39564f] whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      )}
                    </div>

                    {user && user.id === comment.author_id && editCommentId !== comment.id && (
                      <div className="mt-3 flex gap-2 justify-end text-xs font-black">
                        <button
                          onClick={() => {
                            setEditCommentId(comment.id)
                            setEditCommentBody(comment.body)
                          }}
                          className="text-[#0d5b50] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="font-semibold text-[#557169]">No comments yet. Be the first to reply!</p>
              )}
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="border-t-2 border-[#06231f]/10 pt-4 space-y-3">
                <h4 className="text-sm font-black text-[#06231f]">Add a reply</h4>
                <textarea
                  required
                  placeholder="Ask a question or share feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-[#06231f] bg-[#fbfff9] px-4 py-3 font-semibold text-sm outline-none focus:bg-[#fffef1]"
                />
                <button
                  disabled={isCommenting}
                  className="border-2 border-[#06231f] bg-[#06231f] px-5 py-2.5 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] transition disabled:opacity-50"
                >
                  {isCommenting ? 'Posting...' : 'Post Reply'}
                </button>
              </form>
            ) : (
              <div className="border-t-2 border-[#06231f]/10 pt-4 text-center py-4 bg-[#fffef1] border-2 border-[#06231f]">
                <p className="text-sm font-bold text-[#06231f]">Sign in to participate in the discussion</p>
                <Link href="/auth/login" className="mt-2.5 inline-flex border-2 border-[#06231f] bg-[#06231f] px-4 py-1.5 text-xs font-black uppercase text-white hover:bg-[#f7f1bd] hover:text-[#06231f] transition">
                  Login Now
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Sidebar Action/Metadata */}
        <aside className="border-4 border-[#06231f] bg-[#fffef1] p-6 h-fit space-y-6">
          <div>
            <h3 className="text-xl font-black text-[#06231f]">{topic.type === 'rating' ? 'Rating Score' : 'Material File'}</h3>
            
            {topic.type === 'rating' ? (
              <div className="mt-4">
                <p className="display-ink text-5xl font-black text-[#06231f]">{topic.score || 0}/5</p>
                <p className="mt-2 text-sm font-semibold text-[#557169]">{topic.course} - {topic.institution}</p>
              </div>
            ) : topic.file_url ? (
              <div className="mt-4 space-y-3">
                <a href={topic.file_url} download className="w-full text-center block border-2 border-[#06231f] bg-[#06231f] px-4 py-2.5 text-sm font-black text-white hover:bg-[#f7f1bd] hover:text-[#06231f] transition">
                  Download File
                </a>
                <p className="text-xs font-semibold text-[#557169] truncate">
                  Filename: {topic.file_name}
                </p>
                {topic.file_size && (
                  <p className="text-xs text-[#557169]">
                    Size: {(topic.file_size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 font-semibold text-[#557169]">No file attached.</p>
            )}
          </div>

          <div className="border-t-2 border-[#06231f]/10 pt-4">
            <h4 className="text-sm font-black text-[#06231f]">Lecturer Profile</h4>
            <p className="mt-2 text-xs font-semibold text-[#557169]">
              Find all resources and reviews for{' '}
              <Link href={`/teachers/${encodeURIComponent(topic.teacher_name)}`} className="font-black text-[#0d5b50] hover:underline">
                {topic.teacher_name}
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
