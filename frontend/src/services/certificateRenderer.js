/**
 * certificateRenderer.js
 *
 * Renders a certificate's HTML/CSS into a DOM container for a given recipient.
 * Used by exportBulkPDF / exportBulkJPG to generate off-screen DOM nodes
 * that html2canvas can capture.
 *
 * This mirrors exactly what Canvas.jsx renders, but as plain DOM (no React),
 * so it works inside the hidden off-screen container.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function replacePlaceholders(text, recipient, extra = {}) {
  if (!text) return '';
  return text
    .replace(/\{name\}/gi, recipient.name || '')
    .replace(/\{email\}/gi, recipient.email || '')
    .replace(/\{event\}/gi, extra.eventName || '')
    .replace(/\{date\}/gi, extra.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }))
    .replace(/\{college\}/gi, extra.college || '')
    .replace(/\{code\}/gi, recipient.uniqueCode || extra.uniqueCode || '');
}

function getBorderCSS(borderStyle, borderColor, borderWidth) {
  const w = borderWidth || 8;
  const c = borderColor || '#D4A574';
  switch (borderStyle) {
    case 'none':    return '';
    case 'simple':  return `border: ${w}px solid ${c};`;
    case 'double':  return `border: ${w}px double ${c};`;
    case 'elegant': return `border: ${w}px double ${c}; box-shadow: inset 0 0 0 3px ${c}33;`;
    case 'thick':   return `border: ${w + 6}px solid ${c}; box-shadow: 0 0 20px ${c}40;`;
    case 'modern':  return `border-top: ${w}px solid ${c}; border-bottom: ${w}px solid ${c};`;
    case 'shadow':  return `box-shadow: 0 0 30px rgba(0,0,0,0.25), inset 0 0 0 2px ${c};`;
    default:        return `border: ${w}px solid ${c};`;
  }
}

// ─── Main Renderer ───────────────────────────────────────────────────────────

/**
 * Renders a complete certificate into `container` for the given `recipient`.
 *
 * @param {Object}   recipient        — { name, email, uniqueCode, ... }
 * @param {HTMLElement} container     — the off-screen DOM node to render into
 * @param {Object}   templateData     — saved template: { customElements[], designConfig, ... }
 * @param {Object}   extra            — { eventName, date, college }
 */
export function renderCertificateToDOM(recipient, container, templateData, extra = {}) {
  // Handle null or missing templateData
  if (!templateData) {
    templateData = {};
  }

  const {
    customElements = [],
    designConfig = null,
    backgroundColor,
    backgroundGradient,
    borderStyle,
    borderColor,
    borderWidth,
  } = templateData;

  // Merge top-level fields with designConfig (editor saves both)
  // Ensure designConfig is an object before accessing properties
  const dc = designConfig || {};
  const cfg = {
    backgroundColor: dc.backgroundColor || backgroundColor || '#FFFFFF',
    backgroundGradient: dc.backgroundGradient || backgroundGradient || null,
    borderStyle: dc.borderStyle || borderStyle || 'elegant',
    borderColor: dc.borderColor || borderColor || '#D4A574',
    borderWidth: dc.borderWidth || borderWidth || 8,
    width: dc.width || 1050,
    height: dc.height || 744,
  };

  const bgCSS = cfg.backgroundGradient
    ? `background: ${cfg.backgroundGradient};`
    : `background-color: ${cfg.backgroundColor};`;

  const borderCSS = getBorderCSS(cfg.borderStyle, cfg.borderColor, cfg.borderWidth);

  // ── Outer wrapper (exact certificate size) ──
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-certificate-canvas', 'true');
  wrapper.style.cssText = `
    position: relative;
    width: ${cfg.width}px;
    height: ${cfg.height}px;
    ${bgCSS}
    ${borderCSS}
    box-sizing: border-box;
    overflow: hidden;
    font-family: Georgia, serif;
  `;

  // ── Render each element ──
  const sorted = [...customElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const el of sorted) {
    if (el.isHidden) continue;

    const node = document.createElement('div');
    node.style.cssText = `
      position: absolute;
      left: ${el.x || 0}px;
      top: ${el.y || 0}px;
      width: ${el.width || 200}px;
      height: ${el.height || 60}px;
      transform: rotate(${el.rotation || 0}deg);
      transform-origin: center center;
      opacity: ${el.opacity ?? 1};
      overflow: ${el.type === 'text' ? 'visible' : 'hidden'};
      box-sizing: border-box;
    `;

    if (el.type === 'text') {
      const content = replacePlaceholders(el.content || '', recipient, extra);
      node.style.cssText += `
        display: flex;
        align-items: center;
        justify-content: ${el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center'};
        font-size: ${el.fontSize || 24}px;
        color: ${el.color || '#333333'};
        font-family: ${el.fontFamily || 'Georgia, serif'};
        font-weight: ${el.fontWeight || 'normal'};
        font-style: ${el.fontStyle || 'normal'};
        text-decoration: ${el.textDecoration || 'none'};
        text-align: ${el.align || 'center'};
        letter-spacing: ${el.letterSpacing || 0}px;
        line-height: ${el.lineHeight || 1.3};
        word-break: break-word;
        white-space: pre-wrap;
        padding: 2px 4px;
        min-width: max-content;
      `;
      node.textContent = content;
    }

    else if (el.type === 'image' || el.type === 'qrcode') {
      const img = document.createElement('img');
      img.src = el.src || '';
      img.crossOrigin = 'anonymous';
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: ${el.objectFit || 'contain'};
        border-radius: ${el.borderRadius || 0}px;
        display: block;
        max-width: 100%;
        max-height: 100%;
      `;
      node.appendChild(img);
    }

    else if (el.type === 'shape') {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', `0 0 ${el.width || 100} ${el.height || 100}`);
      svg.setAttribute('preserveAspectRatio', 'none');

      const sw = el.strokeWidth || 2;
      const fill = el.fillColor || '#D4A574';
      const stroke = el.strokeColor || '#333333';
      const w = el.width || 100;
      const h = el.height || 100;

      let shape;
      if (el.shapeType === 'circle') {
        shape = document.createElementNS(svgNS, 'ellipse');
        shape.setAttribute('cx', w / 2);
        shape.setAttribute('cy', h / 2);
        shape.setAttribute('rx', w / 2 - sw);
        shape.setAttribute('ry', h / 2 - sw);
      } else if (el.shapeType === 'line') {
        shape = document.createElementNS(svgNS, 'line');
        shape.setAttribute('x1', 0);
        shape.setAttribute('y1', h / 2);
        shape.setAttribute('x2', w);
        shape.setAttribute('y2', h / 2);
      } else if (el.shapeType === 'triangle') {
        shape = document.createElementNS(svgNS, 'polygon');
        shape.setAttribute('points', `${w / 2},0 ${w},${h} 0,${h}`);
      } else {
        shape = document.createElementNS(svgNS, 'rect');
        shape.setAttribute('x', sw);
        shape.setAttribute('y', sw);
        shape.setAttribute('width', w - sw * 2);
        shape.setAttribute('height', h - sw * 2);
      }

      shape.setAttribute('fill', el.shapeType === 'line' ? 'none' : fill);
      shape.setAttribute('stroke', stroke);
      shape.setAttribute('stroke-width', sw);
      svg.appendChild(shape);
      node.appendChild(svg);
    }

    wrapper.appendChild(node);
  }

  container.appendChild(wrapper);
}