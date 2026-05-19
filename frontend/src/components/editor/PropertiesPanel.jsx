import React from 'react';
import {
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Strikethrough,
  ChevronUp, ChevronDown, Lock, Unlock, Eye, EyeOff,
  RotateCcw, Layers,
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: "'Times New Roman', serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { name: 'Courier New', value: "'Courier New', monospace" },
  { name: 'Great Vibes', value: "'Great Vibes', cursive" },
  { name: 'Dancing Script', value: "'Dancing Script', cursive" },
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

function Row({ children, gap = 2 }) {
  return <div className={`flex gap-${gap} items-center`}>{children}</div>;
}

function IconBtn({ active, onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition text-xs ${active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} ${className}`}
    >
      {children}
    </button>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, label }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        type="number"
        value={Math.round(value) || 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

function ColorInput({ value, onChange, label }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

function RangeInput({ value, onChange, min, max, step = 1, label }) {
  return (
    <div>
      {label && <Label>{label}: <span className="text-white">{value}</span></Label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
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
      {/* Position & Size */}
      <Section title="Transform">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <NumberInput label="X" value={Math.round(element.x || 0)} onChange={(v) => update({ x: v })} />
          <NumberInput label="Y" value={Math.round(element.y || 0)} onChange={(v) => update({ y: v })} />
          <NumberInput label="W" value={Math.round(element.width || 0)} min={10} onChange={(v) => update({ width: v })} />
          <NumberInput label="H" value={Math.round(element.height || 0)} min={10} onChange={(v) => update({ height: v })} />
        </div>
        <RangeInput label="Rotation" value={element.rotation || 0} min={-180} max={180}
          onChange={(v) => update({ rotation: v })} />
        <div className="mt-2">
          <RangeInput label="Opacity %" value={Math.round((element.opacity ?? 1) * 100)} min={0} max={100}
            onChange={(v) => update({ opacity: v / 100 })} />
        </div>
      </Section>

      {/* Layer Controls */}
      <Section title="Layer">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => store.getState().bringToFront(element.id)}
            className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
            ↑ Front
          </button>
          <button onClick={() => store.getState().bringForward(element.id)}
            className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
            ↑ Fwd
          </button>
          <button onClick={() => store.getState().sendBackward(element.id)}
            className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
            ↓ Back
          </button>
          <button onClick={() => store.getState().sendToBack(element.id)}
            className="flex-1 text-xs py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition">
            ↓ Rear
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => store.getState().toggleLock(element.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition ${
              element.isLocked ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {element.isLocked ? <><Lock size={12} /> Locked</> : <><Unlock size={12} /> Lock</>}
          </button>
          <button
            onClick={() => store.getState().toggleVisibility(element.id)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition ${
              element.isHidden ? 'bg-gray-600 text-gray-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {element.isHidden ? <><EyeOff size={12} /> Hidden</> : <><Eye size={12} /> Visible</>}
          </button>
        </div>
      </Section>

      {/* TEXT PROPERTIES */}
      {element.type === 'text' && (
        <>
          <Section title="Text Content">
            <textarea
              value={element.content || ''}
              onChange={(e) => update({ content: e.target.value })}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Enter text..."
            />
            <button
              onClick={onTextEdit}
              className="mt-2 w-full text-xs py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
            >
              Edit on Canvas (Double-click)
            </button>
          </Section>

          <Section title="Font">
            <div className="space-y-2">
              <div>
                <Label>Family</Label>
                <select
                  value={element.fontFamily || 'Georgia, serif'}
                  onChange={(e) => update({ fontFamily: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.value} value={f.value}>{f.name}</option>
                  ))}
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
                  <IconBtn active={element.align === 'left'} onClick={() => update({ align: 'left' })} title="Left">
                    <AlignLeft size={12} />
                  </IconBtn>
                  <IconBtn active={!element.align || element.align === 'center'} onClick={() => update({ align: 'center' })} title="Center">
                    <AlignCenter size={12} />
                  </IconBtn>
                  <IconBtn active={element.align === 'right'} onClick={() => update({ align: 'right' })} title="Right">
                    <AlignRight size={12} />
                  </IconBtn>
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

      {/* IMAGE PROPERTIES */}
      {element.type === 'image' && (
        <>
          <Section title="Image">
            <div className="space-y-3">
              <div>
                <Label>Object Fit</Label>
                <select
                  value={element.objectFit || 'contain'}
                  onChange={(e) => update({ objectFit: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
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
        </>
      )}

      {/* SHAPE PROPERTIES */}
      {element.type === 'shape' && (
        <Section title="Shape Style">
          <div className="space-y-3">
            <ColorInput value={element.fillColor} onChange={(v) => update({ fillColor: v })} label="Fill Color" />
            <ColorInput value={element.strokeColor} onChange={(v) => update({ strokeColor: v })} label="Stroke Color" />
            <NumberInput label="Stroke Width" value={element.strokeWidth || 2} min={0} max={30}
              onChange={(v) => update({ strokeWidth: v })} />
          </div>
        </Section>
      )}
    </div>
  );
}