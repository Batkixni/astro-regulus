import { useState, useCallback, useEffect, useRef } from 'react';
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  EditorBubble,
  EditorBubbleItem,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  createImageUpload,
  UploadImagesPlugin,
  StarterKit,
  Placeholder,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  HorizontalRule,
  createSuggestionItems,
  renderItems,
  Command,
} from 'novel';
import { Markdown } from 'tiptap-markdown';
import type { WorkFrontmatter } from '../../lib/mdx';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  slug?: string;
}

interface Credit {
  name: string;
  role: string;
}

// ── S3 image upload ───────────────────────────────────────────────────────────

const uploadFn = createImageUpload({
  validateFn: (file) => file.type.startsWith('image/') && file.size < 20 * 1024 * 1024,
  onUpload: async (file) => {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    if (!res.ok) throw new Error('Failed to get upload URL');
    const { uploadUrl, publicUrl } = await res.json();
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    return publicUrl;
  },
});

async function uploadFile(file: File): Promise<string> {
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!res.ok) throw new Error('Upload failed');
  const { uploadUrl, publicUrl } = await res.json();
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  return publicUrl;
}

// ── Novel extensions ──────────────────────────────────────────────────────────

const suggestionItems = createSuggestionItems([
  {
    title: 'Heading 1',
    description: 'Large section heading',
    searchTerms: ['h1', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    searchTerms: ['h2', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    searchTerms: ['h3', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    searchTerms: ['ul', 'list', 'bullet'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    searchTerms: ['ol', 'list', 'number'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    searchTerms: ['blockquote', 'quote'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    searchTerms: ['code', 'pre'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal separator',
    searchTerms: ['hr', 'divider', 'separator'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Image',
    description: 'Upload an image',
    searchTerms: ['img', 'image', 'photo'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = await uploadFile(file).catch(() => null);
        if (url) editor.chain().focus().setImage({ src: url }).run();
      };
      input.click();
    },
  },
]);

const slashCommand = Command.configure({
  suggestion: { items: () => suggestionItems, render: renderItems },
});

const extensions = [
  StarterKit.configure({ horizontalRule: false }),
  HorizontalRule,
  TiptapImage.configure({ allowBase64: false }),
  TiptapLink.configure({ openOnClick: false }),
  TiptapUnderline,
  Placeholder,
  Markdown.configure({ html: false, tightLists: true }),
  UploadImagesPlugin({ imageClass: 'rounded-lg max-w-full' }),
  slashCommand,
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = (val: string) => {
    const t = val.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[40px] cursor-text">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-700 text-zinc-200 text-xs rounded-md">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="text-zinc-500 hover:text-zinc-200 leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
          if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={value.length ? '' : 'Type & press Enter…'}
        className="flex-1 min-w-[80px] bg-transparent text-zinc-100 text-xs outline-none placeholder-zinc-600"
      />
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try { onChange(await uploadFile(file)); }
    catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex gap-2">
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
        />
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-xs transition disabled:opacity-50 whitespace-nowrap">
          {uploading ? '…' : '↑ S3'}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {value && (
        <img src={value} alt="" className="w-full aspect-video object-cover rounded-lg border border-zinc-700 mt-1"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}
    </div>
  );
}

// ── Field input helper ────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-zinc-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition';

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkEditor({ mode, slug }: Props) {
  const [fm, setFm] = useState<WorkFrontmatter>({
    title: '', client: '', role: [],
    date: new Date().toISOString().slice(0, 10),
    genre: 'Cinematic', thumbnail: '', videoUrl: '', description: '', credits: [],
  });
  const [body, setBody] = useState('');
  const [sha, setSha] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState('');
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (mode !== 'edit' || !slug) return;
    fetch(`/api/admin/works/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoadError(data.error); return; }
        setFm({ ...data.fm, credits: data.fm.credits ?? [] });
        setBody(data.body ?? '');
        setSha(data.sha);
      })
      .catch(() => setLoadError('Failed to load work'))
      .finally(() => setLoading(false));
  }, [mode, slug]);

  const set = useCallback(<K extends keyof WorkFrontmatter>(k: K, v: WorkFrontmatter[K]) => {
    setFm((p) => ({ ...p, [k]: v }));
  }, []);

  const setCredit = (i: number, f: keyof Credit, v: string) => {
    setFm((p) => {
      const c = [...(p.credits ?? [])];
      c[i] = { ...c[i], [f]: v };
      return { ...p, credits: c };
    });
  };

  const save = async () => {
    if (!fm.title.trim()) { alert('Title is required'); return; }
    setStatus('saving');

    let markdown = body;
    if (editorRef.current) {
      try { markdown = editorRef.current.storage?.markdown?.getMarkdown?.() ?? body; } catch {}
    }

    try {
      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/admin/works/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fm, body: markdown }),
        });
      } else {
        res = await fetch(`/api/admin/works/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fm, body: markdown, sha }),
        });
      }
      if (!res.ok) throw new Error(await res.text());
      setStatus('saved');
      if (mode === 'create') {
        const { slug: newSlug } = await res.json();
        setTimeout(() => { window.location.href = `/admin/work/${newSlug}`; }, 900);
      } else {
        setTimeout(() => setStatus('idle'), 2500);
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-600">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-red-400 text-sm">{loadError}</div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Top bar ── */}
      <header className="flex-none flex items-center justify-between px-5 border-b border-zinc-800/80 bg-zinc-950" style={{ height: 52 }}>
        <a href="/admin/dashboard" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Dashboard
        </a>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="text-xs text-emerald-500 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Saved to GitHub</span>}
          {status === 'error' && <span className="text-xs text-red-400">Save failed — check console</span>}
          <button
            onClick={save}
            disabled={status === 'saving'}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-semibold rounded-lg hover:bg-white transition disabled:opacity-60"
          >
            {status === 'saving' ? (
              <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving…</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Publish</>
            )}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="flex-none w-72 xl:w-80 border-r border-zinc-800/80 overflow-y-auto bg-zinc-900/30">
          <div className="p-5 space-y-4">
            <Field label="Title" required>
              <input type="text" value={fm.title} onChange={(e) => set('title', e.target.value)}
                placeholder="Project title" className={`${inputCls} text-sm`} />
            </Field>

            <Field label="Client">
              <input type="text" value={fm.client} onChange={(e) => set('client', e.target.value)}
                placeholder="Client name" className={`${inputCls} text-sm`} />
            </Field>

            <Field label="Role">
              <TagInput value={fm.role} onChange={(v) => set('role', v)} />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Date">
                <input type="date" value={fm.date} onChange={(e) => set('date', e.target.value)}
                  className={`${inputCls} text-xs [color-scheme:dark]`} />
              </Field>
              <Field label="Genre">
                <input type="text" value={fm.genre} onChange={(e) => set('genre', e.target.value)}
                  placeholder="Cinematic" className={`${inputCls} text-xs`} />
              </Field>
            </div>

            <div className="border-t border-zinc-800" />

            <ImageField label="Thumbnail" value={fm.thumbnail} onChange={(v) => set('thumbnail', v)} />

            <Field label="Video URL">
              <input type="url" value={fm.videoUrl ?? ''} onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="YouTube or direct URL" className={`${inputCls} text-xs`} />
            </Field>

            <Field label="Description">
              <textarea value={fm.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Short description…" rows={3}
                className={`${inputCls} text-xs resize-none`} />
            </Field>

            <div className="border-t border-zinc-800" />

            {/* Credits */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400">Credits</label>
              {(fm.credits ?? []).map((c, i) => (
                <div key={i} className="space-y-1 relative group">
                  <input type="text" value={c.name} onChange={(e) => setCredit(i, 'name', e.target.value)}
                    placeholder="Name"
                    className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-t-md text-zinc-100 text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition" />
                  <input type="text" value={c.role} onChange={(e) => setCredit(i, 'role', e.target.value)}
                    placeholder="Role"
                    className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-b-md text-zinc-100 text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition" />
                  <button type="button" onClick={() => setFm((p) => ({ ...p, credits: (p.credits ?? []).filter((_, idx) => idx !== i) }))}
                    className="absolute top-1 right-1 text-zinc-600 hover:text-zinc-400 transition text-xs leading-none w-5 h-5 flex items-center justify-center rounded">×</button>
                </div>
              ))}
              <button type="button"
                onClick={() => setFm((p) => ({ ...p, credits: [...(p.credits ?? []), { name: '', role: '' }] }))}
                className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition mt-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Add credit
              </button>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            <EditorRoot>
              <EditorContent
                initialContent={body || undefined}
                extensions={extensions}
                editorProps={{
                  handleDOMEvents: { keydown: (_view, event) => handleCommandNavigation(event) },
                  handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
                  handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
                  attributes: {
                    class: 'prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[60vh] text-zinc-100 text-[15px] leading-relaxed',
                  },
                }}
                onUpdate={({ editor }) => {
                  editorRef.current = editor;
                  try {
                    const md = editor.storage?.markdown?.getMarkdown?.();
                    if (md !== undefined) setBody(md);
                  } catch {}
                }}
                onCreate={({ editor }) => { editorRef.current = editor; }}
              >
                {/* Slash command menu */}
                <EditorCommand className="z-50 h-auto max-h-72 overflow-y-auto rounded-xl border border-zinc-700/80 bg-zinc-900 px-1 py-2 shadow-2xl shadow-black/50">
                  <EditorCommandEmpty className="px-3 py-2 text-xs text-zinc-500">No results</EditorCommandEmpty>
                  <EditorCommandList>
                    {suggestionItems.map((item) => (
                      <EditorCommandItem
                        key={item.title}
                        value={item.title}
                        onCommand={(val) => item.command(val)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer transition aria-selected:bg-zinc-800"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-500 font-mono text-[11px]">
                          {item.title.startsWith('Heading') ? item.title.replace('Heading ', 'H') :
                            item.title === 'Bullet List' ? '•' :
                            item.title === 'Numbered List' ? '1.' :
                            item.title === 'Quote' ? '"' :
                            item.title === 'Code Block' ? '</>' :
                            item.title === 'Divider' ? '—' :
                            item.title === 'Image' ? '⬜' : '?'}
                        </div>
                        <div>
                          <p className="font-medium text-xs text-zinc-200">{item.title}</p>
                          <p className="text-[11px] text-zinc-500">{item.description}</p>
                        </div>
                      </EditorCommandItem>
                    ))}
                  </EditorCommandList>
                </EditorCommand>

                {/* Bubble menu */}
                <EditorBubble
                  tippyOptions={{ duration: 100, placement: 'top' }}
                  className="flex overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900 shadow-xl shadow-black/40"
                >
                  {[
                    { label: 'B', mark: 'bold', cmd: (e: any) => e.chain().focus().toggleBold().run(), style: 'font-bold' },
                    { label: 'I', mark: 'italic', cmd: (e: any) => e.chain().focus().toggleItalic().run(), style: 'italic' },
                    { label: 'U', mark: 'underline', cmd: (e: any) => e.chain().focus().toggleUnderline().run(), style: 'underline' },
                    { label: 'S', mark: 'strike', cmd: (e: any) => e.chain().focus().toggleStrike().run(), style: 'line-through' },
                    { label: '<>', mark: 'code', cmd: (e: any) => e.chain().focus().toggleCode().run(), style: 'font-mono' },
                  ].map(({ label, mark, cmd, style }) => (
                    <EditorBubbleItem
                      key={mark}
                      onSelect={cmd}
                      className={`px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition border-r border-zinc-700/60 last:border-0 cursor-pointer ${style}`}
                    >
                      {label}
                    </EditorBubbleItem>
                  ))}
                </EditorBubble>
              </EditorContent>
            </EditorRoot>
          </div>
        </main>
      </div>
    </div>
  );
}
