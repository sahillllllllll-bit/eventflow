/**
 * MarkdownEditor.jsx
 * Drop-in rich markdown editor with toolbar + live preview.
 * Zero external dependencies — works with your existing Tailwind setup.
 *
 * Props:
 *   value        string   — controlled markdown string
 *   onChange     fn       — called with new string
 *   placeholder  string   — textarea placeholder
 *   minHeight    string   — CSS min-height for editor area (default "260px")
 */

import React, { useRef, useState, useCallback } from 'react';

// ─── tiny markdown → HTML renderer (no deps) ────────────────────────────────
export function markdownToHtml(md = '') {
  if (!md) return '';
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');

  // Bold + italic combo
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="md-code">$1</code>');

  // Color spans  [text]{#hex}
  html = html.replace(/\[(.+?)\]\{(#[0-9a-fA-F]{3,6})\}/g, '<span style="color:$2">$1</span>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener">$1</a>');

  // Unordered list items (must be done before paragraph wrapping)
  html = html.replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/(<li[\s\S]+?<\/li>)(\n(?!<li))/g, '<ul class="md-ul">$1</ul>\n');
  // Wrap consecutive <li> into single <ul>
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => `<ul class="md-ul">${match}</ul>`);

  // Ordered list items
  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/(<oli>[\s\S]*?<\/oli>\n?)+/g, (match) => {
    const items = match.replace(/<oli>/g, '<li class="md-li">').replace(/<\/oli>/g, '</li>');
    return `<ol class="md-ol">${items}</ol>`;
  });

  // Block quote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Images — ![alt text](image-url)
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="md-img" />');

  // Paragraphs — wrap lines that aren't already block elements
  const blockTags = /^<(h[1-6]|ul|ol|li|hr|blockquote|div|img)/;
  html = html
    .split('\n')
    .map((line) => {
      if (line.trim() === '') return '<br />';
      if (blockTags.test(line.trim())) return line;
      if (line.trim().startsWith('<ul') || line.trim().startsWith('<ol')) return line;
      return `<p class="md-p">${line}</p>`;
    })
    .join('\n');

  return html;
}

// ─── toolbar button definitions ─────────────────────────────────────────────
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#e879f9', '#ffffff'];

const ToolbarButton = ({ onClick, title, children, active, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center justify-center w-7 h-7 rounded text-xs font-medium
      transition-colors select-none
      ${disabled
        ? 'text-gray-600 cursor-not-allowed'
        : active
          ? 'bg-brand text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10'}
    `}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />;

// ─── main component ──────────────────────────────────────────────────────────
const MarkdownEditor = ({
  value = '',
  onChange,
  placeholder = 'Write your event description, rules, schedule… Markdown supported.',
  minHeight = '260px',
  eventId = null,
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('write'); // 'write' | 'preview'
  const [colorOpen, setColorOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── wrap selection or insert at cursor ──────────────────────────────────
  const wrap = useCallback((before, after = before, defaultText = 'text') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const newVal =
      value.slice(0, start) +
      before + selected + after +
      value.slice(end);
    onChange(newVal);
    // Restore selection after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      const newStart = start + before.length;
      ta.setSelectionRange(newStart, newStart + selected.length);
    });
  }, [value, onChange]);

  const insertLine = useCallback((prefix, defaultText = 'text') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    // Find start of current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.slice(0, lineStart);
    const after  = value.slice(lineStart);
    const newVal = before + prefix + after;
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = lineStart + prefix.length + (after.startsWith(defaultText) ? defaultText.length : 0);
      ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + defaultText.length);
    });
  }, [value, onChange]);

  const insertAtCursor = useCallback((text) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newVal = value.slice(0, start) + text + value.slice(start);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }, [value, onChange]);

  const applyColor = (hex) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = value.slice(start, end) || 'colored text';
    const snippet = `[${selected}]{${hex}}`;
    const newVal = value.slice(0, start) + snippet + value.slice(end);
    onChange(newVal);
    setColorOpen(false);
    requestAnimationFrame(() => ta.focus());
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      // Upload directly to Cloudinary using unsigned upload (no backend needed)
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        console.error('Cloudinary cloud name not configured');
        setUploadingImage(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'eventflow_markdown'); // Create this unsigned preset in Cloudinary dashboard
      formData.append('folder', 'eventflow/markdown-images');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Cloudinary upload error:', error);
        throw new Error(error.error?.message || 'Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;
      const altText = file.name.split('.')[0].replace(/[^a-z0-9]/gi, ' ');
      const markdownImage = `![${altText}](${imageUrl})`;

      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const newVal = value.slice(0, start) + '\n' + markdownImage + '\n' + value.slice(start);
        onChange(newVal);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + markdownImage.length + 2, start + markdownImage.length + 2);
        });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface-overlay">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 bg-surface-raised border-b border-border">
        {/* Headings */}
        <ToolbarButton title="Heading 1" onClick={() => insertLine('# ', 'Heading')}>H1</ToolbarButton>
        <ToolbarButton title="Heading 2" onClick={() => insertLine('## ', 'Heading')}>H2</ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => insertLine('### ', 'Heading')}>H3</ToolbarButton>

        <Divider />

        {/* Inline */}
        <ToolbarButton title="Bold" onClick={() => wrap('**', '**', 'bold text')}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => wrap('*', '*', 'italic text')}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => wrap('~~', '~~', 'strikethrough')}>
          <span className="line-through text-[11px]">S</span>
        </ToolbarButton>
        <ToolbarButton title="Inline code" onClick={() => wrap('`', '`', 'code')}>
          {'</>'}
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton title="Bullet list" onClick={() => insertLine('- ', 'List item')}>
          {/* bullet list icon */}
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <circle cx="2" cy="4" r="1.5"/><rect x="5" y="3" width="9" height="2" rx="1"/>
            <circle cx="2" cy="8" r="1.5"/><rect x="5" y="7" width="9" height="2" rx="1"/>
            <circle cx="2" cy="12" r="1.5"/><rect x="5" y="11" width="9" height="2" rx="1"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => insertLine('1. ', 'List item')}>
          {/* ordered list icon */}
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text>
            <rect x="5" y="3" width="9" height="2" rx="1"/>
            <text x="0" y="9" fontSize="5" fontFamily="monospace">2.</text>
            <rect x="5" y="7" width="9" height="2" rx="1"/>
            <text x="0" y="13" fontSize="5" fontFamily="monospace">3.</text>
            <rect x="5" y="11" width="9" height="2" rx="1"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Block quote" onClick={() => insertLine('> ', 'Quote')}>
          {/* quote icon */}
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <rect x="0" y="2" width="2" height="12" rx="1"/>
            <rect x="4" y="4" width="10" height="2" rx="1"/>
            <rect x="4" y="8" width="8" height="2" rx="1"/>
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton title="Insert link" onClick={() => {
          const ta = textareaRef.current;
          const sel = ta ? value.slice(ta.selectionStart, ta.selectionEnd) : '';
          const text = sel || 'link text';
          wrap(`[${sel ? '' : text}`, '](https://)', sel ? '' : '');
          // simpler: just insert template
          if (!sel) insertAtCursor('[link text](https://)');
        }}>
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.5 9.5a1 1 0 0 0 1.415 0l2-2a1 1 0 0 0-1.415-1.414L7.086 7.5l-.293-.293a1 1 0 0 0-1.414 1.414l.293.293-.707.707a1 1 0 0 0 0 1.415zm3-3a1 1 0 0 0-1.414 0l-2 2a1 1 0 0 0 1.414 1.414l.414-.414.293.293a1 1 0 0 0 1.414-1.414l-.293-.293.707-.707a1 1 0 0 0 0-1.415z"/>
          </svg>
        </ToolbarButton>

        {/* Horizontal rule */}
        <ToolbarButton title="Horizontal divider" onClick={() => insertAtCursor('\n---\n')}>
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <rect x="1" y="7" width="14" height="2" rx="1"/>
          </svg>
        </ToolbarButton>

        {/* Image upload */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <ToolbarButton
            title="Insert image"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <svg className="animate-spin w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="1" opacity="0.2"/>
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
                <path d="M2 11l4-4 2 2 6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            )}
          </ToolbarButton>
        </div>

        {/* Color picker */}
        <div className="relative">
          <ToolbarButton title="Text color" onClick={() => setColorOpen(o => !o)}>
            <span className="font-bold" style={{ color: '#f59e0b' }}>A</span>
          </ToolbarButton>
          {colorOpen && (
            <div
              className="absolute top-9 left-0 z-50 flex gap-1 p-2 bg-surface-raised border border-border rounded-lg shadow-xl"
              onMouseLeave={() => setColorOpen(false)}
            >
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => applyColor(c)}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform flex-shrink-0"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Write / Preview tabs */}
        <div className="flex items-center gap-1 bg-surface-overlay rounded-lg p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              tab === 'write' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              tab === 'preview' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* ── Editor / Preview area ────────────────────────────────────────── */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck
          className="w-full px-4 py-4 bg-transparent text-white placeholder-gray-600 outline-none resize-y font-mono text-sm leading-relaxed"
          style={{ minHeight }}
        />
      ) : (
        <div
          className="px-5 py-4 prose-md overflow-auto text-gray-200 text-sm leading-relaxed"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(value) || '<p class="text-gray-600 italic">Nothing to preview yet.</p>' }}
        />
      )}

      {/* ── Footer hint ─────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-border bg-surface-raised flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Markdown supported · <kbd className="px-1 py-0.5 rounded bg-surface-overlay text-gray-500 text-[10px]">**bold**</kbd>
          {' '}<kbd className="px-1 py-0.5 rounded bg-surface-overlay text-gray-500 text-[10px]">*italic*</kbd>
          {' '}<kbd className="px-1 py-0.5 rounded bg-surface-overlay text-gray-500 text-[10px]"># Heading</kbd>
          {' '}<kbd className="px-1 py-0.5 rounded bg-surface-overlay text-gray-500 text-[10px]">- list</kbd>
        </span>
        <span className="text-xs text-gray-600">{value.length} chars</span>
      </div>

      {/* ── Global prose styles injected once ───────────────────────────── */}
      <style>{`
        .md-h1 { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 1.2rem 0 0.5rem; line-height: 1.2; }
        .md-h2 { font-size: 1.25rem; font-weight: 700; color: #e5e5e5; margin: 1rem 0 0.4rem; }
        .md-h3 { font-size: 1.05rem; font-weight: 600; color: #d4d4d4; margin: 0.8rem 0 0.3rem; }
        .md-p  { margin: 0.4rem 0; color: #c4c4c4; line-height: 1.7; }
        .md-ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .md-ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .md-li { margin: 0.2rem 0; color: #c4c4c4; }
        .md-hr { border: none; border-top: 1px solid #2a2a3a; margin: 1rem 0; }
        .md-code { background: #1e1e2e; color: #a5f3fc; padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.88em; }
        .md-link { color: #818cf8; text-decoration: underline; }
        .md-blockquote { border-left: 3px solid #6C47FF; padding: 0.3rem 0.8rem; margin: 0.6rem 0; color: #9ca3af; font-style: italic; background: rgba(108,71,255,0.07); border-radius: 0 6px 6px 0; }
        .md-img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.8rem 0; max-height: 600px; }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;