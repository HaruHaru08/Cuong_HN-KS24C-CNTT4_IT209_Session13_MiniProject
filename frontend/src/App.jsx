import { useCallback, useEffect, useState } from 'react'
import { api, clearCredentials, setCredentials } from './api.js'

const emptyPost = { title: '', content: '', categoryId: '' }

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function App() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', status: '' })
  const [dialog, setDialog] = useState(null) // 'login', 'post', 'claim', 'report', 'admin'
  const [notice, setNotice] = useState('')

  const showNotice = (msg) => {
    setNotice(msg)
  }

  const loadPosts = useCallback(async () => {
    const query = new URLSearchParams()
    if (filters.keyword) query.set('keyword', filters.keyword)
    if (filters.categoryId) query.set('categoryId', filters.categoryId)
    if (filters.status) query.set('status', filters.status)
    try {
      const page = await api(`/posts?${query}`)
      setPosts(page.content)
    } catch (error) {
      showNotice(error.message)
    }
  }, [filters])

  useEffect(() => {
    api('/categories').then(setCategories).catch((error) => showNotice(error.message))
    api('/auth/me').then(setUser).catch(() => clearCredentials())
  }, [])

  useEffect(() => {
    const query = new URLSearchParams()
    if (filters.keyword) query.set('keyword', filters.keyword)
    if (filters.categoryId) query.set('categoryId', filters.categoryId)
    if (filters.status) query.set('status', filters.status)
    let active = true
    api(`/posts?${query}`)
      .then((page) => {
        if (active) setPosts(page.content)
      })
      .catch((error) => {
        if (active) showNotice(error.message)
      })
    return () => {
      active = false
    }
  }, [filters])

  async function openPost(id) {
    try {
      const postData = await api(`/posts/${id}`)
      setSelectedPost(postData)
    } catch (error) {
      showNotice(error.message)
    }
  }

  function logout() {
    clearCredentials()
    setUser(null)
    setSelectedPost(null)
    showNotice('Đã đăng xuất thành công')
  }

  async function refreshSelected() {
    if (selectedPost) await openPost(selectedPost.id)
    await loadPosts()
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSelectedPost(null)}>
          <div className="brand-logo">
            <span className="brand-badge">PTIT</span>
            <span className="brand-icon">🏛️</span>
          </div>
          <div className="brand-text">
            <strong>Campus Hub Pro</strong>
            <small>Cộng đồng & Trao đổi Đồ dùng PTIT</small>
          </div>
        </button>

        <nav>
          {user ? (
            <>
              <div className="user-profile">
                <span className="user-avatar">{user.displayName ? user.displayName[0].toUpperCase() : 'U'}</span>
                <div className="user-info">
                  <strong>{user.displayName}</strong>
                  <span className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'student'}`}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên'}
                  </span>
                </div>
              </div>

              {user.role === 'ADMIN' && (
                <button className="button admin-btn" onClick={() => setDialog('admin')}>
                  🛡️ Bảng Quản trị
                </button>
              )}

              <button className="button primary" onClick={() => setDialog('post')}>
                + Đăng bài mới
              </button>
              <button className="button secondary" onClick={logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <button className="button primary" onClick={() => setDialog('login')}>
              🔑 Đăng nhập / Đăng ký
            </button>
          )}
        </nav>
      </header>

      <main>
        {notice && (
          <div className="notice" onClick={() => setNotice('')}>
            <span>🔔 {notice}</span>
            <button className="notice-close">✕</button>
          </div>
        )}

        {selectedPost ? (
          <PostDetail
            post={selectedPost}
            user={user}
            onBack={() => setSelectedPost(null)}
            onChanged={refreshSelected}
            onDeleted={() => {
              setSelectedPost(null)
              loadPosts()
            }}
            setNotice={showNotice}
            onOpenClaim={() => setDialog('claim')}
            onOpenReport={() => setDialog('report')}
          />
        ) : (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="eyebrow">HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG · IT209</p>
                <h1>Không gian Kết nối & Trao đổi Đời sống Sinh viên</h1>
                <p>
                  Tìm đồ thất lạc, trao đổi giáo trình - đồ dùng, tìm nhóm học tập và thông báo sự kiện sinh viên PTIT với
                  quy trình xác minh và bàn giao bảo mật, tin cậy.
                </p>

                <div className="hero-tags">
                  <span className="hero-pill">✅ Quy trình Trao nhận & Xác minh</span>
                  <span className="hero-pill">🔒 Bảo mật thông tin liên hệ</span>
                  <span className="hero-pill">🛡️ Kiểm duyệt vi phạm tự động</span>
                </div>
              </div>

              <div className="hero-stats-panel">
                <div className="stat-card">
                  <strong>{posts.length}</strong>
                  <span>Bài đăng đang hiển thị</span>
                </div>
                <div className="stat-card highlight">
                  <strong>{posts.filter((p) => p.status === 'RESOLVED').length}</strong>
                  <span>Giao dịch hoàn tất</span>
                </div>
                <div className="stat-card">
                  <strong>6</strong>
                  <span>Chuyên mục hỗ trợ</span>
                </div>
              </div>
            </section>

            <section className="filters-bar" aria-label="Tìm kiếm và lọc bài đăng">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  value={filters.keyword}
                  placeholder="Tìm kiếm theo tiêu đề hoặc nội dung bài đăng..."
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
                {filters.keyword && (
                  <button className="clear-btn" onClick={() => setFilters({ ...filters, keyword: '' })}>
                    ✕
                  </button>
                )}
              </div>

              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">📂 Tất cả chuyên mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">📌 Trạng thái: Tất cả</option>
                <option value="PUBLISHED">🟢 Đang mở / Tìm chủ</option>
                <option value="RESOLVED">✔️ Đã hoàn tất / Đã trao trả</option>
              </select>
            </section>

            <section className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onOpen={openPost} />
              ))}
              {!posts.length && (
                <div className="empty-box">
                  <span className="empty-icon">📭</span>
                  <h3>Không tìm thấy bài đăng phù hợp</h3>
                  <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên mục khác.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>
            <strong>Campus Hub Pro</strong> · Mini Project Session 13 — IT209 DevOps & Phát triển Hệ thống
          </p>
          <p className="subtext">
            Học viện Công nghệ Bưu chính Viễn thông (PTIT) · Nền tảng Spring Boot 3 & React & MySQL
          </p>
        </div>
      </footer>

      {dialog === 'login' && (
        <AuthDialog
          onClose={() => setDialog(null)}
          onLogin={(loggedInUser) => {
            setUser(loggedInUser)
            setDialog(null)
            showNotice(`Xin chào ${loggedInUser.displayName}! Đăng nhập thành công.`)
            loadPosts()
          }}
        />
      )}

      {dialog === 'post' && (
        <PostDialog
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            showNotice('Đăng bài viết mới thành công!')
            loadPosts()
          }}
        />
      )}

      {dialog === 'claim' && selectedPost && (
        <ClaimDialog
          post={selectedPost}
          onClose={() => setDialog(null)}
          onClaimed={() => {
            setDialog(null)
            showNotice('Đã gửi yêu cầu trao nhận thành công! Chủ bài viết sẽ xem xét và phản hồi.')
            refreshSelected()
          }}
        />
      )}

      {dialog === 'report' && selectedPost && (
        <ReportDialog
          post={selectedPost}
          onClose={() => setDialog(null)}
          onReported={() => {
            setDialog(null)
            showNotice('Đã gửi báo cáo vi phạm. Quản trị viên sẽ kiểm tra và xử lý.')
          }}
        />
      )}

      {dialog === 'admin' && (
        <AdminDashboardModal
          onClose={() => setDialog(null)}
          setNotice={showNotice}
          onPostsChanged={loadPosts}
        />
      )}
    </div>
  )
}

function PostCard({ post, onOpen }) {
  const isResolved = post.status === 'RESOLVED'
  return (
    <article className={`post-card ${isResolved ? 'resolved-card' : ''}`} onClick={() => onOpen(post.id)}>
      <div className="card-top">
        <span className="tag-category">{post.category.name}</span>
        <span className={`status-pill ${isResolved ? 'status-resolved' : 'status-published'}`}>
          {isResolved ? '✔️ Đã hoàn tất' : '🟢 Đang mở'}
        </span>
      </div>

      <h2 className="post-card-title">{post.title}</h2>
      <p className="post-card-body">{post.content}</p>

      <div className="card-footer">
        <div className="author-meta">
          <span className="author-avatar">{post.author.displayName[0]}</span>
          <div className="author-details">
            <strong>{post.author.displayName}</strong>
            <small>{formatDate(post.createdAt)}</small>
          </div>
        </div>

        <div className="card-stats">
          <span title="Lượt quan tâm">❤️ {post.reactionCount}</span>
          <span title="Bình luận">💬 {post.commentCount}</span>
          {post.claimCount > 0 && <span title="Yêu cầu trao nhận">🤝 {post.claimCount}</span>}
        </div>
      </div>
    </article>
  )
}

function PostDetail({ post, user, onBack, onChanged, onDeleted, setNotice, onOpenClaim, onOpenReport }) {
  const [comment, setComment] = useState('')
  const [claims, setClaims] = useState([])
  const [reviewNote, setReviewNote] = useState('')
  const [selectedClaimId, setSelectedClaimId] = useState(null)

  const isAuthor = user && user.id === post.author.id
  const isAdmin = user && user.role === 'ADMIN'
  const canManage = isAuthor || isAdmin
  const isResolved = post.status === 'RESOLVED'

  // Tải danh sách claims nếu người dùng đã đăng nhập
  const loadClaims = useCallback(async () => {
    if (!user) return
    try {
      const data = await api(`/posts/${post.id}/claims`)
      setClaims(data || [])
    } catch {
      // Bỏ qua lỗi nếu không có quyền
    }
  }, [post.id, user])

  useEffect(() => {
    let active = true
    if (user) {
      api(`/posts/${post.id}/claims`)
        .then((data) => {
          if (active) setClaims(data || [])
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [post.id, user])

  async function act(action, successMsg) {
    try {
      await action()
      setNotice(successMsg)
      await onChanged()
      await loadClaims()
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function handleReviewClaim(claimId, status) {
    try {
      await api(`/posts/${post.id}/claims/${claimId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, responseMessage: reviewNote || (status === 'APPROVED' ? 'Đã duyệt yêu cầu' : 'Từ chối yêu cầu') }),
      })
      setNotice(status === 'APPROVED' ? 'Đã duyệt yêu cầu trao nhận' : 'Đã từ chối yêu cầu')
      setReviewNote('')
      setSelectedClaimId(null)
      await onChanged()
      await loadClaims()
    } catch (err) {
      setNotice(err.message)
    }
  }

  async function handleCompleteHandover(claimId) {
    if (!window.confirm('Xác nhận đã bàn giao / trao đổi thành công? Bài viết sẽ được đánh dấu HOÀN TẤT.')) return
    try {
      await api(`/posts/${post.id}/claims/${claimId}/handover`, { method: 'POST' })
      setNotice('Tuyệt vời! Giao dịch trao nhận đã hoàn tất thành công!')
      await onChanged()
      await loadClaims()
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <section className="detail-view">
      <button className="back-button" onClick={onBack}>
        ← Quay lại trang chủ
      </button>

      <div className="detail-main-card">
        <div className="detail-header">
          <div className="detail-tags">
            <span className="tag-category">{post.category.name}</span>
            <span className={`status-pill ${isResolved ? 'status-resolved' : 'status-published'}`}>
              {isResolved ? '✔️ Đã bàn giao / Hoàn tất' : '🟢 Đang mở / Tìm chủ'}
            </span>
          </div>
          <span className="detail-date">{formatDate(post.createdAt)}</span>
        </div>

        <h1 className="detail-title">{post.title}</h1>

        <div className="detail-author-row">
          <span className="author-avatar large">{post.author.displayName[0]}</span>
          <div>
            <strong>{post.author.displayName}</strong>
            <div className="muted">Tác giả bài đăng · @{post.author.username}</div>
          </div>
        </div>

        <div className="detail-content">{post.content}</div>

        <div className="detail-actions-bar">
          <button
            className={`button ${post.reactedByCurrentUser ? 'primary' : 'secondary'}`}
            disabled={!user}
            onClick={() =>
              act(
                () => api(`/posts/${post.id}/reaction`, { method: 'POST' }),
                post.reactedByCurrentUser ? 'Đã hủy bày tỏ quan tâm' : 'Đã bày tỏ quan tâm ❤️'
              )
            }
          >
            {post.reactedByCurrentUser ? '❤️ Đã quan tâm' : '🤍 Quan tâm'} ({post.reactionCount})
          </button>

          {/* Nút gửi yêu cầu nhận đồ (cho sinh viên khác khi bài chưa xong) */}
          {user && !isAuthor && !isResolved && (
            <button className="button claim-btn" onClick={onOpenClaim}>
              🤝 Gửi yêu cầu nhận / Trao đổi
            </button>
          )}

          {/* Nút báo cáo vi phạm */}
          {user && !isAuthor && (
            <button className="button text-danger" onClick={onOpenReport}>
              🚩 Báo cáo vi phạm
            </button>
          )}

          {canManage && !isResolved && (
            <button
              className="button secondary"
              onClick={() =>
                act(
                  () =>
                    api(`/posts/${post.id}/status`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'RESOLVED' }),
                    }),
                  'Đã đánh dấu hoàn tất bài đăng'
                )
              }
            >
              ✔️ Đánh dấu hoàn tất
            </button>
          )}

          {isAdmin && post.status !== 'HIDDEN' && (
            <button
              className="button secondary"
              onClick={() =>
                act(
                  () =>
                    api(`/posts/${post.id}/status`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'HIDDEN' }),
                    }),
                  'Đã ẩn bài đăng vi phạm'
                )
              }
            >
              👁️‍🗨️ Ẩn bài đăng
            </button>
          )}

          {canManage && (
            <button
              className="button danger"
              onClick={async () => {
                if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này vĩnh viễn?')) return
                try {
                  await api(`/posts/${post.id}`, { method: 'DELETE' })
                  setNotice('Đã xóa bài đăng thành công')
                  onDeleted()
                } catch (error) {
                  setNotice(error.message)
                }
              }}
            >
              🗑️ Xóa bài
            </button>
          )}
        </div>
      </div>

      {/* KHU VỰC QUẢN LÝ QUY TRÌNH TRAO NHẬN / CLAIM */}
      {user && (claims.length > 0 || isAuthor) && (
        <div className="claim-section">
          <div className="section-header">
            <h3>🤝 Quy trình Trao nhận & Xác minh quyền sở hữu ({claims.length})</h3>
            <span className="privacy-badge">🔒 Thông tin liên hệ được bảo mật nội bộ</span>
          </div>

          {!claims.length && isAuthor && (
            <div className="claim-empty">
              <p>Chưa có yêu cầu nhận đồ hoặc trao đổi nào gửi tới bài đăng này.</p>
              <small>Khi có sinh viên gửi yêu cầu xác minh, danh sách sẽ hiển thị tại đây để bạn phê duyệt.</small>
            </div>
          )}

          {claims.map((claim) => (
            <div key={claim.id} className={`claim-card status-${claim.status.toLowerCase()}`}>
              <div className="claim-card-header">
                <div className="claim-user">
                  <strong>{claim.claimant.displayName}</strong> (@{claim.claimant.username})
                  <span className={`claim-badge badge-${claim.status.toLowerCase()}`}>
                    {claim.status === 'PENDING' && '⏳ Chờ phê duyệt'}
                    {claim.status === 'APPROVED' && '✅ Đã chấp thuận'}
                    {claim.status === 'REJECTED' && '❌ Đã từ chối'}
                    {claim.status === 'HANDED_OVER' && '🎉 Đã hoàn tất bàn giao'}
                  </span>
                </div>
                <small>{formatDate(claim.createdAt)}</small>
              </div>

              <div className="claim-details">
                <div className="claim-field">
                  <span className="label">Bằng chứng xác minh:</span>
                  <p>{claim.proofDescription}</p>
                </div>

                <div className="claim-field contact-box">
                  <span className="label">Thông tin liên hệ bảo mật:</span>
                  <p>
                    📞 <strong>{claim.contactInfo}</strong>
                    {claim.meetingNote && <span> · Địa điểm/Ghi chú: {claim.meetingNote}</span>}
                  </p>
                </div>

                {claim.responseMessage && (
                  <div className="claim-field response-box">
                    <span className="label">Phản hồi từ chủ bài đăng:</span>
                    <p>{claim.responseMessage}</p>
                  </div>
                )}
              </div>

              {/* Tác giả duyệt hoặc hoàn tất bàn giao */}
              {canManage && claim.status !== 'HANDED_OVER' && (
                <div className="claim-actions">
                  {claim.status === 'PENDING' && (
                    <>
                      {selectedClaimId === claim.id ? (
                        <div className="review-input-group">
                          <input
                            placeholder="Lời nhắn cho sinh viên nhận đồ..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                          />
                          <button
                            className="button primary small"
                            onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                          >
                            Xác nhận Duyệt
                          </button>
                          <button
                            className="button danger small"
                            onClick={() => handleReviewClaim(claim.id, 'REJECTED')}
                          >
                            Từ chối
                          </button>
                          <button
                            className="button secondary small"
                            onClick={() => setSelectedClaimId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          className="button primary small"
                          onClick={() => {
                            setSelectedClaimId(claim.id)
                            setReviewNote('')
                          }}
                        >
                          Xem xét & Phê duyệt
                        </button>
                      )}
                    </>
                  )}

                  {claim.status === 'APPROVED' && (
                    <button
                      className="button success-handover small"
                      onClick={() => handleCompleteHandover(claim.id)}
                    >
                      🎉 Xác nhận Đã Bàn Giao Thành Công
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KHU VỰC BÌNH LUẬN */}
      <div className="comments-section">
        <h2>💬 Bình luận cộng đồng ({post.commentCount})</h2>

        {user ? (
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault()
              act(
                () =>
                  api(`/posts/${post.id}/comments`, {
                    method: 'POST',
                    body: JSON.stringify({ content: comment }),
                  }),
                'Đã gửi bình luận thành công'
              ).then(() => setComment(''))
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ ý kiến hoặc trao đổi thêm với tác giả..."
              required
              maxLength="1000"
              rows="3"
            />
            <button className="button primary">Gửi bình luận</button>
          </form>
        ) : (
          <div className="login-prompt">
            <span>🔑 Vui lòng đăng nhập để bình luận hoặc gửi yêu cầu nhận đồ.</span>
          </div>
        )}

        <div className="comment-list">
          {post.comments.map((item) => (
            <div className="comment-item" key={item.id}>
              <div className="comment-author-row">
                <span className="author-avatar small">{item.author.displayName[0]}</span>
                <strong>{item.author.displayName}</strong>
                <span className="comment-time">{formatDate(item.createdAt)}</span>
              </div>
              <p className="comment-text">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClaimDialog({ post, onClose, onClaimed }) {
  const [form, setForm] = useState({ proofDescription: '', contactInfo: '', meetingNote: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api(`/posts/${post.id}/claims`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onClaimed()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog title="🤝 Gửi yêu cầu nhận / Trao đổi đồ" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="modal-intro">
          <p>
            Bạn đang gửi yêu cầu nhận đồ/trao đổi cho bài đăng: <strong>"{post.title}"</strong>.
          </p>
          <small>
            Vui lòng cung cấp chi tiết bằng chứng để chủ bài viết xác minh đúng chủ nhân hoặc đúng đối tượng trao đổi.
          </small>
        </div>

        {error && <div className="form-error">{error}</div>}

        <label>
          Bằng chứng xác minh quyền sở hữu / Nhu cầu nhận đồ *
          <textarea
            required
            rows="4"
            maxLength="2000"
            placeholder="Ví dụ: Màu sắc chi tiết, số seri thẻ sinh viên, đặc điểm nhận dạng riêng, hoặc giáo trình cần đổi..."
            value={form.proofDescription}
            onChange={(e) => setForm({ ...form, proofDescription: e.target.value })}
          />
        </label>

        <label>
          Thông tin liên hệ bí mật (SĐT / Zalo / Email) *
          <input
            required
            maxLength="255"
            placeholder="Ví dụ: 0912.345.678 (Zalo: Minh Anh)"
            value={form.contactInfo}
            onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
          />
          <small className="field-hint">Chỉ có chủ bài viết mới xem được thông tin này.</small>
        </label>

        <label>
          Đề xuất địa điểm & thời gian gặp (Tùy chọn)
          <input
            maxLength="500"
            placeholder="Ví dụ: Sảnh A2 tầng 1 giờ ra chơi chiều thứ 4"
            value={form.meetingNote}
            onChange={(e) => setForm({ ...form, meetingNote: e.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button className="button primary" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu xác minh'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function ReportDialog({ post, onClose, onReported }) {
  const [form, setForm] = useState({ reason: 'SPAM', detail: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api(`/posts/${post.id}/report`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onReported()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog title="🚩 Báo cáo bài đăng vi phạm" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Lý do báo cáo vi phạm *
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            <option value="SPAM">Quảng cáo rác / Spam lặp lại</option>
            <option value="FRAUD">Lừa đảo / Sai sự thật</option>
            <option value="INAPPROPRIATE">Nội dung phản cảm / Không văn minh</option>
            <option value="MISCATEGORIZED">Sai chuyên mục quy định</option>
            <option value="OTHER">Lý do khác</option>
          </select>
        </label>

        <label>
          Chi tiết phản ánh (Tùy chọn)
          <textarea
            rows="3"
            maxLength="1000"
            placeholder="Mô tả cụ thể hành vi vi phạm để ban quản trị dễ dàng xử lý..."
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button className="button danger" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi báo cáo vi phạm'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function AdminDashboardModal({ onClose, setNotice, onPostsChanged }) {
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const reloadData = useCallback(async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        api('/admin/stats'),
        api('/admin/reports?status=PENDING'),
      ])
      setStats(statsData)
      setReports(reportsData || [])
    } catch (err) {
      setNotice(err.message)
    }
  }, [setNotice])

  useEffect(() => {
    let active = true
    Promise.all([
      api('/admin/stats'),
      api('/admin/reports?status=PENDING'),
    ])
      .then(([statsData, reportsData]) => {
        if (active) {
          setStats(statsData)
          setReports(reportsData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setNotice(err.message)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [setNotice])

  async function handleDismiss(reportId) {
    try {
      await api(`/admin/reports/${reportId}/dismiss`, { method: 'PATCH' })
      setNotice('Đã bỏ qua báo cáo')
      await reloadData()
    } catch (err) {
      setNotice(err.message)
    }
  }

  async function handleHidePost(reportId) {
    if (!window.confirm('Bạn có chắc chắn muốn ẨN bài đăng vi phạm này?')) return
    try {
      await api(`/admin/reports/${reportId}/hide-post`, { method: 'PATCH' })
      setNotice('Đã ẩn bài đăng vi phạm thành công!')
      await reloadData()
      await onPostsChanged()
    } catch (err) {
      setNotice(err.message)
    }
  }

  return (
    <Dialog title="🛡️ Bảng Điều Khiển Quản Trị Hệ Thống (Admin Moderation)" onClose={onClose} width="850px">
      {loading ? (
        <p className="loading-text">Đang tải dữ liệu quản trị...</p>
      ) : (
        <div className="admin-dashboard">
          {stats && (
            <div className="stats-grid">
              <div className="admin-stat-card">
                <span>Tổng bài đăng</span>
                <strong>{stats.totalPosts}</strong>
              </div>
              <div className="admin-stat-card highlight-green">
                <span>Đang hoạt động</span>
                <strong>{stats.activePosts}</strong>
              </div>
              <div className="admin-stat-card highlight-purple">
                <span>Đã giải quyết</span>
                <strong>{stats.resolvedPosts}</strong>
              </div>
              <div className="admin-stat-card">
                <span>Yêu cầu trao nhận</span>
                <strong>{stats.totalClaims}</strong>
              </div>
              <div className="admin-stat-card highlight-red">
                <span>Báo cáo chờ duyệt</span>
                <strong>{stats.pendingReports}</strong>
              </div>
            </div>
          )}

          <h3>📋 Danh sách bài đăng bị báo cáo vi phạm ({reports.length})</h3>

          {!reports.length ? (
            <div className="admin-empty">
              <span>🎉 Hiện tại không có bài đăng nào bị báo cáo vi phạm cần xử lý.</span>
            </div>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Bài đăng</th>
                    <th>Người báo cáo</th>
                    <th>Lý do</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.postTitle}</strong>
                        {r.detail && <p className="report-detail-text">"{r.detail}"</p>}
                      </td>
                      <td>{r.reporter.displayName}</td>
                      <td>
                        <span className="reason-badge">{r.reason}</span>
                      </td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            className="button danger small"
                            onClick={() => handleHidePost(r.id)}
                            title="Ẩn bài viết khỏi hệ thống"
                          >
                            Ẩn bài
                          </button>
                          <button
                            className="button secondary small"
                            onClick={() => handleDismiss(r.id)}
                            title="Bỏ qua báo cáo này"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

function AuthDialog({ onClose, onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', displayName: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: JSON.stringify(form) })
      }
      setCredentials(form.username, form.password)
      onLogin(await api('/auth/me'))
    } catch (requestError) {
      clearCredentials()
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function fillSample(uname, pass) {
    setForm({ ...form, username: uname, password: pass })
    setError('')
  }

  return (
    <Dialog title={mode === 'login' ? '🔑 Đăng nhập hệ thống' : '📝 Tạo tài khoản mới'} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Tên đăng nhập *
          <input
            required
            minLength="3"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
            placeholder="Ví dụ: student hoặc admin"
          />
        </label>

        {mode === 'register' && (
          <label>
            Họ và tên hiển thị *
            <input
              required
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              placeholder="Ví dụ: Nguyễn Minh Anh"
            />
          </label>
        )}

        <label>
          Mật khẩu *
          <input
            required
            minLength="6"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Tối thiểu 6 ký tự"
          />
        </label>

        <button className="button primary full-width" disabled={loading}>
          {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>

        {mode === 'login' && (
          <div className="sample-accounts">
            <span className="sample-label">Tài khoản mẫu trình diễn:</span>
            <div className="sample-tags">
              <button
                type="button"
                className="sample-btn"
                onClick={() => fillSample('student', 'student123')}
              >
                Sinh viên: <code>student</code>
              </button>
              <button
                type="button"
                className="sample-btn"
                onClick={() => fillSample('admin', 'admin123')}
              >
                Quản trị: <code>admin</code>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="toggle-auth-btn"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
          }}
        >
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </form>
    </Dialog>
  )
}

function PostDialog({ categories, onClose, onSaved }) {
  const [form, setForm] = useState(emptyPost)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api('/posts', { method: 'POST', body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }) })
      onSaved()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog title="📝 Đăng bài viết / Chia sẻ thông tin" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Tiêu đề bài đăng *
          <input
            required
            maxLength="160"
            placeholder="Ví dụ: Nhặt được thẻ sinh viên PTIT tại sảnh A2..."
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </label>

        <label>
          Chuyên mục *
          <select
            required
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">-- Chọn chuyên mục phù hợp --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Nội dung chi tiết *
          <textarea
            required
            maxLength="10000"
            rows="6"
            placeholder="Mô tả cụ thể thời gian, vị trí, đặc điểm, thông tin hỗ trợ..."
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="button primary" disabled={loading}>
            {loading ? 'Đang đăng...' : 'Đăng bài viết'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function Dialog({ title, onClose, children, width = '560px' }) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="dialog-box"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>{title}</h2>
          <button className="dialog-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  )
}

export default App
