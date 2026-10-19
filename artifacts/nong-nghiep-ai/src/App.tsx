import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Bot, Check, ChevronRight, CircleHelp, CloudSun, FileText, Leaf,
  LoaderCircle, MapPin, MessageCircle, Plus, Send, ShieldCheck, Sprout, Trash2,
  X, Droplets, Bug, Search, Database, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  useAddAgricultureDocument, useAskAgricultureQuestion, useDeleteAgricultureDocument,
  useGetAgricultureStatus, useListAgricultureDocuments,
  getGetAgricultureStatusQueryKey, getListAgricultureDocumentsQueryKey,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import '@/index.css';

const client = new QueryClient();
const categoryLabels: Record<string, string> = {
  crop: 'Cây trồng', pest: 'Sâu bệnh', soil: 'Đất đai', irrigation: 'Tưới tiêu', general: 'Tổng hợp',
};
const categoryIcons: Record<string, typeof Sprout> = {
  crop: Sprout, pest: Bug, soil: Leaf, irrigation: Droplets, general: BookOpen,
};

function AppShell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  return (
    <div className="app-frame">
      <aside className="side-rail" aria-label="Điều hướng chính">
        <div className="brand-lockup">
          <div className="brand-mark"><Sprout size={21} strokeWidth={2.3} /></div>
          <div><div className="brand-title">Mùa Vụ</div><div className="brand-subtitle">Bạn đồng hành nhà nông</div></div>
        </div>
        <nav className="side-nav" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 43 }}>
          <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} data-testid="link-chat"><MessageCircle /><span>Hỏi đáp mùa vụ</span></Link>
          <Link href="/knowledge" className={`nav-link ${path === '/knowledge' ? 'active' : ''}`} data-testid="link-knowledge"><BookOpen /><span>Thư viện kiến thức</span></Link>
        </nav>
        <div className="rail-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#dce7d4', fontSize: 11, fontWeight: 700 }}>
            <ShieldCheck size={16} color="#e9b65d" /> Kiến thức có nguồn dẫn
          </div>
          <p style={{ color: '#a9bbab', fontSize: 10, lineHeight: 1.6, margin: '9px 0 0' }}>Tra cứu dựa trên tài liệu chuyên ngành được lưu trong thư viện.</p>
        </div>
      </aside>
      <div className="main-stage">
        <header className="topbar">
          <div className="topbar-kicker">Trợ lý nông nghiệp · Việt Nam</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#57705c', fontSize: 11, fontWeight: 700 }}><CloudSun size={16} /> Đồng hành trên đồng ruộng</div>
        </header>
        {children}
      </div>
    </div>
  );
}

function ErrorNotice({ message, retry }: { message: string; retry: () => void }) {
  return <div className="alert-error" role="alert" data-testid="status-error">
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><AlertTriangle size={15} /> Chưa thể tải dữ liệu</div>
    <p style={{ margin: '6px 0 10px' }}>{message}</p>
    <button className="secondary-btn" onClick={retry} data-testid="button-retry"><RefreshCw size={14} /> Thử lại</button>
  </div>;
}

function LoadingPanel() {
  return <div className="surface" style={{ padding: 20 }} aria-label="Đang tải nội dung" data-testid="loading-content">
    <div className="loading-bar" style={{ width: '35%', marginBottom: 18 }} />
    <div className="loading-bar" style={{ width: '85%', marginBottom: 11 }} />
    <div className="loading-bar" style={{ width: '68%' }} />
  </div>;
}

function ChatPage() {
  const statusQuery = useGetAgricultureStatus();
  const docsQuery = useListAgricultureDocuments();
  const askMutation = useAskAgricultureQuestion();
  const [question, setQuestion] = useState('');
  const [crop, setCrop] = useState('');
  const [location, setLocation] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const status = statusQuery.data;
  const documents = docsQuery.data ?? [];
  const examples = [
    'Lúa đang làm đòng cần bón phân thế nào?',
    'Lá cà chua có đốm nâu, nên kiểm tra gì trước?',
    'Đất trồng rau mùa khô tưới bao nhiêu là đủ?',
  ];
  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    const clean = question.trim();
    if (clean.length < 4 || askMutation.isPending) return;
    setLastQuestion(clean);
    askMutation.mutate({ data: { question: clean, ...(crop.trim() ? { crop: crop.trim() } : {}), ...(location.trim() ? { location: location.trim() } : {}) } });
    setQuestion('');
  };
  const answer = askMutation.data;

  return <main className="content-wrap">
    <div className="eyebrow">Hỏi người bạn đồng hành</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
      <div><h1 className="page-title">Việc đồng áng,<br />cùng tìm lời giải.</h1>
        <p className="page-lede">Hỏi về cây trồng, đất, nước hay sâu bệnh. Mỗi câu trả lời đều đi kèm tài liệu tham khảo để bà con tự kiểm chứng.</p></div>
      <div className="pill" data-testid="status-assistant"><span className="pill-dot" /> Trợ lý tra cứu {status?.status === 'ready' ? 'sẵn sàng' : status?.status === 'degraded' ? 'đang hạn chế' : 'đang kết nối'}</div>
    </div>
    {statusQuery.isLoading && <div style={{ marginTop: 22 }}><LoadingPanel /></div>}
    {statusQuery.isError && <div style={{ marginTop: 18 }}><ErrorNotice message="Không lấy được trạng thái trợ lý. Bạn vẫn có thể thử gửi câu hỏi." retry={() => statusQuery.refetch()} /></div>}

    {status && !status.geminiConfigured && <div className="status-banner" role="status" data-testid="status-gemini">
      <AlertTriangle size={17} style={{ flex: '0 0 auto', marginTop: 1 }} />
      <div><strong>Gemini chưa được kết nối.</strong> Câu trả lời tạo sinh hiện chưa khả dụng. Khi gửi câu hỏi, hệ thống chỉ hiển thị nội dung truy xuất nếu máy chủ trả về kết quả cùng nguồn dẫn; không có kết quả thì sẽ không tạo câu trả lời thay thế.</div>
    </div>}

    <section className="chat-layout" aria-label="Hỏi đáp nông nghiệp">
      <div className="surface chat-main">
        <div className="chat-scroll" aria-live="polite">
          {!lastQuestion && !answer && <div className="assistant-line">
            <div className="assistant-avatar"><Sprout size={17} /></div>
            <div><div style={{ fontSize: 11, color: '#7d8a7d', fontWeight: 700, margin: '1px 0 6px' }}>MÙA VỤ · TRA CỨU CÓ NGUỒN</div>
              <div className="answer-copy">Chào bà con. Mình có thể giúp tra cứu kiến thức canh tác từ tài liệu trong thư viện. Hãy kể rõ cây trồng, dấu hiệu đang gặp và điều bà con muốn biết.</div></div>
          </div>}
          {lastQuestion && <div className="user-bubble" data-testid="text-last-question">{lastQuestion}</div>}
          {askMutation.isPending && <div className="assistant-line" data-testid="status-answer-loading"><div className="assistant-avatar"><LoaderCircle size={16} className="animate-spin" /></div><div className="answer-copy">Đang đối chiếu câu hỏi với tài liệu trong thư viện…</div></div>}
          {askMutation.isError && <div className="alert-error" role="alert" data-testid="status-answer-error">Chưa nhận được phản hồi từ hệ thống. Kiểm tra kết nối rồi thử lại nhé.</div>}
          {answer && <div className="assistant-line" data-testid="answer-result">
            <div className="assistant-avatar"><Sprout size={17} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 9 }}>
                <span style={{ fontSize: 11, color: '#7d8a7d', fontWeight: 800 }}>KẾT QUẢ TRA CỨU</span>
                <span className="pill" style={{ padding: '4px 8px', fontSize: 9 }} data-testid="text-answer-mode">{answer.mode === 'gemini' ? 'Gemini' : 'Truy xuất tài liệu'}</span>
                <span style={{ color: '#728272', fontSize: 10 }} data-testid="text-answer-confidence">Độ tin cậy: {answer.confidence === 'high' ? 'cao' : answer.confidence === 'medium' ? 'trung bình' : 'thấp'}</span>
              </div>
              <div className="answer-copy">{answer.answer}</div>
              {answer.citations?.length > 0 ? <div style={{ marginTop: 17 }}>
                <div style={{ color: '#5d725f', fontWeight: 800, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>Tài liệu làm căn cứ · {answer.citations.length}</div>
                {answer.citations.map((citation, index) => <div className="citation-card" key={`${citation.documentId}-${index}`} data-testid={`citation-${citation.documentId}`}>
                  <div className="citation-head"><div><div className="citation-title">{citation.title}</div><div className="citation-detail">{categoryLabels[citation.category] || citation.category} · {citation.source || 'Không ghi nguồn'}</div></div>
                    <span className="pill" style={{ fontSize: 9, padding: '4px 7px' }}>Nguồn {index + 1}</span></div>
                  <blockquote className="citation-excerpt">“{citation.excerpt}”</blockquote>
                </div>)}
              </div> : <div className="status-banner" style={{ marginTop: 14 }} data-testid="status-no-citations"><AlertTriangle size={15} /> Phản hồi không có tài liệu trích dẫn. Hãy xem đây là thông tin chưa được thư viện xác thực.</div>}
              {answer.mode === 'retrieval' && <p className="footnote" style={{ marginTop: 12 }}>Đây là kết quả truy xuất từ tài liệu, không phải tư vấn chuyên gia tại địa phương.</p>}
            </div>
          </div>}
        </div>
        <form className="chat-input-area" onSubmit={submitQuestion}>
          <div className="chat-compose">
            <textarea aria-label="Câu hỏi của bà con" data-testid="input-question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ví dụ: Lúa trổ gặp mưa nhiều, cần lưu ý điều gì?" maxLength={2000} />
            <div className="compose-bottom">
              <div className="compose-meta">
                <input aria-label="Cây trồng" data-testid="input-crop" value={crop} onChange={e => setCrop(e.target.value)} placeholder="Cây trồng" maxLength={80} />
                <input aria-label="Khu vực" data-testid="input-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Tỉnh / khu vực" maxLength={120} />
              </div>
              <button className="primary-btn" type="submit" disabled={question.trim().length < 4 || askMutation.isPending} data-testid="button-send-question">
                {askMutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />} Hỏi
              </button>
            </div>
          </div>
          <div className="footnote" style={{ marginTop: 9 }}>Thông tin cây trồng và khu vực giúp việc tra cứu sát với tình huống hơn.</div>
        </form>
      </div>
      <aside className="surface side-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#2f563c', fontWeight: 800, fontSize: 13 }}><CircleHelp size={17} /> Gợi ý câu hỏi</div>
        <p style={{ color: '#778276', fontSize: 11, lineHeight: 1.6, margin: '8px 0 3px' }}>Chọn một câu để bắt đầu, hoặc viết theo cách của bà con.</p>
        {examples.map((example, i) => <button key={example} className="suggestion" onClick={() => setQuestion(example)} data-testid={`button-suggestion-${i}`}>{example}<ChevronRight size={14} style={{ float: 'right', marginTop: 2 }} /></button>)}
        <div style={{ borderTop: '1px solid #ebe6da', marginTop: 19, paddingTop: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', color: '#839083', fontWeight: 800, textTransform: 'uppercase' }}>Thư viện đang có</div>
          <div className="metric-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 10 }}>
            <div className="metric-box"><div className="metric-number" data-testid="text-document-count">{status?.documentCount ?? (docsQuery.data?.length ?? '—')}</div><div className="metric-label">Tài liệu</div></div>
            <div className="metric-box"><div className="metric-number" data-testid="text-chunk-count">{status?.chunkCount ?? '—'}</div><div className="metric-label">Đoạn tra cứu</div></div>
          </div>
          {docsQuery.isError && <div className="footnote" style={{ marginTop: 10 }}>Chưa tải được danh sách tài liệu.</div>}
        </div>
        <Link href="/knowledge" className="secondary-btn" style={{ width: '100%', marginTop: 15, textDecoration: 'none', boxSizing: 'border-box' }} data-testid="link-view-library">Mở thư viện <ChevronRight size={14} /></Link>
      </aside>
    </section>
  </main>;
}

function AddDocumentModal({ close, added }: { close: () => void; added: () => void }) {
  const addMutation = useAddAgricultureDocument();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'crop' | 'pest' | 'soil' | 'irrigation' | 'general'>('crop');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    addMutation.mutate({ data: { title: title.trim(), category, ...(source.trim() ? { source: source.trim() } : {}), content: content.trim() } }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListAgricultureDocumentsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetAgricultureStatusQueryKey() }),
        ]);
        setSuccessMessage('Đã thêm tài liệu vào thư viện.');
        added();
      },
    });
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !addMutation.isPending) close(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-doc-title" data-testid="dialog-add-document">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div><div className="eyebrow">Bổ sung kiến thức</div><h2 id="add-doc-title" style={{ font: '800 24px var(--app-font-serif)', color: '#1f4937', margin: '5px 0 5px' }}>Thêm tài liệu</h2><p className="page-lede" style={{ fontSize: 12 }}>Nội dung sẽ được chia thành các đoạn để phục vụ tra cứu.</p></div>
        <button className="icon-btn" onClick={close} aria-label="Đóng" data-testid="button-close-dialog"><X size={16} /></button>
      </div>
      <form onSubmit={submit} style={{ display: 'grid', gap: 15, marginTop: 22 }}>
        <label><span className="field-label">Tên tài liệu <span style={{ color: '#a74737' }}>*</span></span><input className="input-field" data-testid="input-document-title" required minLength={2} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Hướng dẫn chăm sóc lúa giai đoạn đẻ nhánh" /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label><span className="field-label">Nhóm kiến thức</span><select className="select-field" value={category} onChange={e => setCategory(e.target.value as 'crop' | 'pest' | 'soil' | 'irrigation' | 'general')} data-testid="select-document-category">{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span className="field-label">Nguồn tham khảo</span><input className="input-field" value={source} onChange={e => setSource(e.target.value)} maxLength={240} placeholder="Cơ quan, tác giả hoặc đường dẫn" data-testid="input-document-source" /></label>
        </div>
        <label><span className="field-label">Nội dung tài liệu <span style={{ color: '#a74737' }}>*</span></span><textarea className="text-area" rows={8} required minLength={40} maxLength={40000} value={content} onChange={e => setContent(e.target.value)} placeholder="Dán nội dung hướng dẫn, quy trình hoặc ghi chú canh tác tại đây…" data-testid="input-document-content" /><span className="footnote">{content.length.toLocaleString('vi-VN')} / 40.000 ký tự · Tối thiểu 40 ký tự</span></label>
        {addMutation.isError && <div className="alert-error" role="alert" data-testid="status-add-error">Không thể lưu tài liệu. Vui lòng kiểm tra nội dung và thử lại.</div>}
        {successMessage && <div className="pill" role="status" data-testid="status-add-success"><Check size={13} /> {successMessage}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, paddingTop: 4 }}>
          <button type="button" className="secondary-btn" onClick={close} data-testid="button-cancel-add">Hủy</button>
          <button className="primary-btn" type="submit" disabled={addMutation.isPending || title.trim().length < 2 || content.trim().length < 40} data-testid="button-submit-document">
            {addMutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} {addMutation.isPending ? 'Đang lưu…' : 'Lưu tài liệu'}
          </button>
        </div>
      </form>
    </section>
  </div>;
}

function KnowledgePage() {
  const queryClient = useQueryClient();
  const docsQuery = useListAgricultureDocuments();
  const statusQuery = useGetAgricultureStatus();
  const deleteMutation = useDeleteAgricultureDocument();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const docs = docsQuery.data ?? [];
  const filtered = useMemo(() => docs.filter(doc => {
    const matchesSearch = `${doc.title} ${doc.source} ${doc.contentPreview}`.toLocaleLowerCase('vi').includes(filter.toLocaleLowerCase('vi'));
    return matchesSearch && (categoryFilter === 'all' || doc.category === categoryFilter);
  }), [docs, filter, categoryFilter]);
  const removeDoc = () => {
    if (!pendingDelete || deleteMutation.isPending) return;
    deleteMutation.mutate({ documentId: pendingDelete.id }, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListAgricultureDocumentsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetAgricultureStatusQueryKey() }),
        ]);
        setFeedback(`Đã xóa “${pendingDelete.title}”.`);
        setPendingDelete(null);
      },
    });
  };
  return <main className="content-wrap">
    <div className="eyebrow">Nền tảng tri thức</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
      <div><h1 className="page-title">Thư viện kiến thức</h1><p className="page-lede">Tài liệu làm căn cứ cho mỗi lần tra cứu. Thêm cẩm nang, hướng dẫn kỹ thuật và ghi chú hữu ích cho mùa vụ.</p></div>
      <button className="primary-btn" onClick={() => { setFeedback(''); setModalOpen(true); }} data-testid="button-add-document"><Plus size={16} /> Thêm tài liệu</button>
    </div>

    <div className="metric-grid" style={{ marginTop: 24 }}>
      <div className="surface metric-box" style={{ display: 'flex', gap: 13, alignItems: 'center' }}><div className="brand-mark"><FileText size={18} /></div><div><div className="metric-number" data-testid="text-library-doc-count">{statusQuery.data?.documentCount ?? docs.length}</div><div className="metric-label">Tài liệu</div></div></div>
      <div className="surface metric-box" style={{ display: 'flex', gap: 13, alignItems: 'center' }}><div className="brand-mark" style={{ background: '#e8eee2', color: '#27573e' }}><Database size={18} /></div><div><div className="metric-number" data-testid="text-library-chunk-count">{statusQuery.data?.chunkCount ?? '—'}</div><div className="metric-label">Đoạn tra cứu</div></div></div>
      <div className="surface metric-box" style={{ display: 'flex', gap: 13, alignItems: 'center' }}><div className="brand-mark" style={{ background: statusQuery.data?.geminiConfigured ? '#e8eee2' : '#f5e9d2', color: '#27573e' }}><Bot size={18} /></div><div><div className="metric-number" style={{ fontSize: 14, marginTop: 4 }} data-testid="text-gemini-status">{statusQuery.data?.geminiConfigured ? 'Đã kết nối' : statusQuery.isLoading ? 'Đang kiểm tra' : 'Chưa kết nối'}</div><div className="metric-label">Gemini</div></div></div>
    </div>
    {statusQuery.isError && <div style={{ marginTop: 15 }}><ErrorNotice message="Không tải được trạng thái thư viện." retry={() => statusQuery.refetch()} /></div>}
    {feedback && <div role="status" data-testid="status-document-feedback" className="pill" style={{ marginTop: 17 }}><Check size={13} /> {feedback}</div>}
    {deleteMutation.isError && <div className="alert-error" role="alert" style={{ marginTop: 15 }} data-testid="status-delete-error">Không xóa được tài liệu. Vui lòng thử lại.</div>}

    <div className="library-toolbar">
      <div>
        <div style={{ font: '800 20px var(--app-font-serif)', color: '#274634' }}>Tài liệu đã lưu <span style={{ color: '#8a9889', fontSize: 13, fontFamily: 'DM Sans' }}>({docs.length})</span></div>
        <div style={{ color: '#849084', fontSize: 11, marginTop: 5 }}>Quản lý nguồn tri thức của trợ lý</div>
      </div>
      <div style={{ display: 'flex', gap: 9, width: 'min(100%,470px)' }}>
        <div style={{ position: 'relative', flex: 1 }}><Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#849084' }} /><input className="input-field" style={{ paddingLeft: 34 }} value={filter} onChange={e => setFilter(e.target.value)} placeholder="Tìm theo tên hoặc nguồn…" data-testid="input-search-documents" /></div>
        <select className="select-field" style={{ width: 145 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Lọc theo nhóm" data-testid="select-filter-category"><option value="all">Mọi nhóm</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
    </div>

    {docsQuery.isLoading ? <div className="doc-grid">{[1, 2, 3, 4].map(n => <div className="surface" key={n} style={{ padding: 20 }} data-testid={`skeleton-document-${n}`}><div className="loading-bar" style={{ width: '25%', marginBottom: 16 }} /><div className="loading-bar" style={{ width: '68%', marginBottom: 12 }} /><div className="loading-bar" style={{ width: '100%' }} /></div>)}</div>
      : docsQuery.isError ? <ErrorNotice message="Không thể tải danh sách tài liệu." retry={() => docsQuery.refetch()} />
        : docs.length === 0 ? <div className="surface empty-state" data-testid="empty-documents">
          <div className="brand-mark" style={{ margin: '0 auto 16px', width: 48, height: 48 }}><BookOpen size={22} /></div>
          <h2 style={{ font: '800 21px var(--app-font-serif)', color: '#244a35', margin: '0 0 8px' }}>Thư viện đang chờ tài liệu đầu tiên</h2>
          <p className="page-lede" style={{ margin: '0 auto 18px', fontSize: 12 }}>Thêm hướng dẫn canh tác hoặc tài liệu khuyến nông để trợ lý có căn cứ trả lời.</p>
          <button className="primary-btn" onClick={() => setModalOpen(true)} data-testid="button-add-first-document"><Plus size={15} /> Thêm tài liệu đầu tiên</button>
        </div>
        : filtered.length === 0 ? <div className="surface empty-state" data-testid="empty-filter-results"><Search size={23} color="#789078" style={{ marginBottom: 10 }} /><div style={{ fontWeight: 700, color: '#31543c' }}>Chưa tìm thấy tài liệu phù hợp</div><p className="footnote">Thử đổi từ khóa hoặc chọn nhóm khác.</p></div>
          : <div className="doc-grid">
            {filtered.map(doc => {
              const CategoryIcon = categoryIcons[doc.category] || FileText;
              return <article className="surface doc-card" key={doc.id} data-testid={`card-document-${doc.id}`}>
                <div className="doc-meta"><span className="doc-category"><CategoryIcon size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />{categoryLabels[doc.category] || doc.category}</span>
                  <button className="icon-btn" aria-label={`Xóa ${doc.title}`} title="Xóa tài liệu" onClick={() => { setFeedback(''); setPendingDelete({ id: doc.id, title: doc.title }); }} data-testid={`button-delete-document-${doc.id}`}><Trash2 size={15} /></button>
                </div>
                <h3 className="doc-title">{doc.title}</h3>
                <div className="doc-preview">{doc.contentPreview}</div>
                <div className="doc-footer"><span>{doc.source || 'Chưa ghi nguồn'}</span><span>{doc.chunkCount} đoạn</span></div>
              </article>;
            })}
          </div>}
    <div className="footnote" style={{ marginTop: 17, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> Mô hình nhúng: {statusQuery.data?.embeddingModel || 'đang tải trạng thái'}</div>
    {modalOpen && <AddDocumentModal close={() => setModalOpen(false)} added={() => { setTimeout(() => setModalOpen(false), 700); }} />}
    {pendingDelete && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPendingDelete(null); }}>
      <section className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title" style={{ width: 'min(430px,100%)' }} data-testid="dialog-confirm-delete">
        <div style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#f8e9e3', color: '#9a4a39' }}><Trash2 size={19} /></div>
        <h2 id="confirm-delete-title" style={{ font: '800 21px var(--app-font-serif)', color: '#274634', margin: '15px 0 7px' }}>Xóa tài liệu này?</h2>
        <p style={{ color: '#69786b', fontSize: 13, lineHeight: 1.6 }}>“{pendingDelete.title}” và các đoạn tra cứu liên quan sẽ bị xóa khỏi thư viện.</p>
        {deleteMutation.isError && <div className="alert-error" role="alert">Xóa chưa thành công. Bà con có thể thử lại.</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 21 }}>
          <button className="secondary-btn" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending} data-testid="button-cancel-delete">Giữ lại</button>
          <button className="primary-btn" style={{ background: '#9a4a39' }} onClick={removeDoc} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">{deleteMutation.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />} Xóa tài liệu</button>
        </div>
      </section>
    </div>}
  </main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <AppShell><RoutedErrorBoundary><Switch>
    <Route path="/" component={ChatPage} />
    <Route path="/knowledge" component={KnowledgePage} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary></AppShell>;
}

function App() {
  return <QueryClientProvider client={client}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
