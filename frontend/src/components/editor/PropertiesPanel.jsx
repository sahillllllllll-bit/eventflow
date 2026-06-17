import React from 'react';
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Strikethrough,
  Lock, Unlock, Eye, EyeOff,
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Georgia',         value: 'Georgia, serif' },
  { name: 'Times New Roman', value: "'Times New Roman', serif" },
  { name: 'Playfair Display',value: "'Playfair Display', serif" },
  { name: 'Arial',           value: 'Arial, sans-serif' },
  { name: 'Trebuchet MS',    value: "'Trebuchet MS', sans-serif" },
  { name: 'Courier New',     value: "'Courier New', monospace" },
  { name: 'Great Vibes',     value: "'Great Vibes', cursive" },
  { name: 'Dancing Script',  value: "'Dancing Script', cursive" },
];

function Section({ title, children }) {
  return (
    <div className="border-b border-gray-700 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}
function Label({ children }) {
  return <p className="text-xs text-gray-400 mb-1">{children}</p>;
}
function Row({ children }) {
  return <div className="flex gap-2 items-center">{children}</div>;
}
function IconBtn({ active, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded transition text-xs ${active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
      {children}
    </button>
  );
}
function NumberInput({ value, onChange, min, max, step = 1, label }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input type="number" value={Math.round(value) || 0} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500" />
    </div>
  );
}

// ── ColorInput supports "transparent" ────────────────────────────────────────
function ColorInput({ value, onChange, label }) {
  const isTransparent = !value || value === 'transparent' || value === 'none';
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-center">
        <button
          title="Toggle transparent"
          onClick={() => onChange(isTransparent ? '#ffffff' : 'transparent')}
          className={`w-8 h-8 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition ${
            isTransparent ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-gray-600 text-gray-500 hover:border-gray-400'
          }`}
          style={isTransparent ? {} : {
            background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px',
          }}
        >
          {isTransparent ? 'T' : ''}
        </button>
        {!isTransparent ? (
          <>
            <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent flex-shrink-0" />
            <input type="text" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500" />
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Transparent (no fill)</span>
        )}
      </div>
    </div>
  );
}

function RangeInput({ value, onChange, min, max, step = 1, label }) {
  return (
    <div>
      {label && <Label>{label}: <span className="text-white">{value}</span></Label>}
      <input type="range" min={min} max={max} step={step} value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500" />
    </div>
  );
}

export default function PropertiesPanel({ element, store, onTextEdit }) {
  const update = (updates) => store.getState().updateElement(element.id, updates);

  if (!element) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-6 text-center">
      Select an element to edit its properties
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto text-white">

      {/* Transform */}
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <NumberInput label="X" value={Math.round(element.x || 0)} onChange={(v) => update({ x: v })} />
          <NumberInput label="Y" value={Math.round(element.y || 0)} onChange={(v) => update({ y: v })} />
          <NumberInput label="W" value={Math.round(element.width || 0)} min={10} onChange={(v) => update({ width: v })} />
          <NumberInput label="H" value={Math.round(element.height || 0)} min={10} onChange={(v) => update({ height: v })} />
        </div>
        <RangeInput label="Rotation" value={element.rotation || 0} min={-180} max={180} onChange={(v) => update({ rotation: v })} />
        <div className="mt-2">
          <RangeInput label="Opacity %" value={Math.round((element.opacity ?? 1) * 100)} min={0} max={100}
            onChange={(v) => update({ opacity: v / 100 })} />
        </div>
      </Section>

      {/* Layer */}
      <Section title="Layer">
        <div className="flex gap-1 flex-wrap">
          {[
            { label: '↑ Front', fn: () => store.getState().bringToFront(element.id) },
            { label: '↑ Fwd',   fn: () => store.getState().bringForward(element.id) },
            { label: '↓ Back',  fn: () => store.getState().sendBackward(element.id) },
            { label: '↓ Rear',  fn: () => store.getState().sendToBack(element.id) },
          ].map(b => (
            <button key={b.label} onClick={b.fn}
              className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => store.getState().toggleLock(element.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition ${
              element.isLocked ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {element.isLocked ? <><Lock size={12} /> Locked</> : <><Unlock size={12} /> Lock</>}
          </button>
          <button onClick={() => store.getState().toggleVisibility(element.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition ${
              element.isHidden ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {element.isHidden ? <><EyeOff size={12} /> Hidden</> : <><Eye size={12} /> Visible</>}
          </button>
        </div>
      </Section>

      {/* TEXT */}
      {element.type === 'text' && (
        <>
          <Section title="Text Content">
            <textarea value={element.content || ''} onChange={(e) => update({ content: e.target.value })}
              rows={3} placeholder="Enter text..."
              className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 resize-none" />
            <button onClick={onTextEdit}
              className="mt-2 w-full text-xs py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition">
              Edit on Canvas (Double-click)
            </button>
          </Section>

          <Section title="Font">
            <div className="space-y-2">
              <div>
                <Label>Family</Label>
                <select value={element.fontFamily || 'Georgia, serif'}
                  onChange={(e) => update({ fontFamily: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500">
                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                </select>
              </div>
              <NumberInput label="Size (px)" value={element.fontSize || 24} min={6} max={200}
                onChange={(v) => update({ fontSize: v })} />
              <div>
                <Label>Style</Label>
                <Row>
                  <IconBtn active={element.fontWeight === 'bold'} title="Bold"
                    onClick={() => update({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}>
                    <Bold size={12} />
                  </IconBtn>
                  <IconBtn active={element.fontStyle === 'italic'} title="Italic"
                    onClick={() => update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}>
                    <Italic size={12} />
                  </IconBtn>
                  <IconBtn active={element.textDecoration === 'underline'} title="Underline"
                    onClick={() => update({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}>
                    <Underline size={12} />
                  </IconBtn>
                  <IconBtn active={element.textDecoration === 'line-through'} title="Strikethrough"
                    onClick={() => update({ textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' })}>
                    <Strikethrough size={12} />
                  </IconBtn>
                </Row>
              </div>
              <div>
                <Label>Align</Label>
                <Row>
                  <IconBtn active={element.align === 'left'} onClick={() => update({ align: 'left' })} title="Left"><AlignLeft size={12} /></IconBtn>
                  <IconBtn active={!element.align || element.align === 'center'} onClick={() => update({ align: 'center' })} title="Center"><AlignCenter size={12} /></IconBtn>
                  <IconBtn active={element.align === 'right'} onClick={() => update({ align: 'right' })} title="Right"><AlignRight size={12} /></IconBtn>
                </Row>
              </div>
              <RangeInput label="Letter Spacing" value={element.letterSpacing || 0} min={-5} max={30}
                onChange={(v) => update({ letterSpacing: v })} />
              <RangeInput label="Line Height" value={element.lineHeight || 1.3} min={0.8} max={4} step={0.1}
                onChange={(v) => update({ lineHeight: v })} />
            </div>
          </Section>

          <Section title="Color">
            <ColorInput value={element.color} onChange={(v) => update({ color: v })} label="Text Color" />
          </Section>
        </>
      )}

      {/* IMAGE */}
      {element.type === 'image' && (
        <Section title="Image">
          <div className="space-y-3">
            <div>
              <Label>Object Fit</Label>
              <select value={element.objectFit || 'contain'} onChange={(e) => update({ objectFit: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500">
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </div>
            <NumberInput label="Border Radius (px)" value={element.borderRadius || 0} min={0} max={500}
              onChange={(v) => update({ borderRadius: v })} />
          </div>
        </Section>
      )}

      {/* SHAPE */}
      {element.type === 'shape' && (
        <Section title="Shape Style">
          <div className="space-y-3">
            <ColorInput value={element.fillColor} onChange={(v) => update({ fillColor: v })} label="Fill Color" />
            <ColorInput value={element.strokeColor} onChange={(v) => update({ strokeColor: v })} label="Stroke Color" />
            <NumberInput label="Stroke Width" value={element.strokeWidth || 2} min={0} max={30}
              onChange={(v) => update({ strokeWidth: v })} />
            <div>
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <button onClick={() => update({ fillColor: 'transparent', strokeColor: element.strokeColor || '#D4A574', strokeWidth: element.strokeWidth || 2 })}
                  className="text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition border border-dashed border-gray-600">
                  Outline Only
                </button>
                <button onClick={() => update({ fillColor: element.fillColor || '#D4A574', strokeColor: 'transparent', strokeWidth: 0 })}
                  className="text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                  Fill Only
                </button>
                <button onClick={() => update({ opacity: 0.5 })}
                  className="text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                  50% Opacity
                </button>
                <button onClick={() => update({ opacity: 0.2 })}
                  className="text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
                  20% Opacity
                </button>
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}