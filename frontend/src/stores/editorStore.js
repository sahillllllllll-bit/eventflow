import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const HISTORY_LIMIT = 50;

const createEditorStore = (template = null) => {
  return create(
    immer((set, get) => ({
      // ============ CANVAS STATE ============
      zoom: 0.7,
      panX: 0,
      panY: 0,
      showGrid: false,
      snapToGrid: false,
      gridSize: 20,

      // ============ ELEMENTS & SELECTION ============
      elements: [],
      selectedElementIds: [],

      // ============ DESIGN CONFIG ============
      // Initialise from template top-level fields AND template.designConfig
      // (designConfig takes priority if present — it's the canvas editor's own save)
      designConfig: {
        backgroundColor:    template?.designConfig?.backgroundColor    || template?.backgroundColor    || '#FFFFFF',
        backgroundGradient: template?.designConfig?.backgroundGradient || template?.backgroundGradient || null,
        borderStyle:        template?.designConfig?.borderStyle        || template?.borderStyle        || 'elegant',
        borderColor:        template?.designConfig?.borderColor        || template?.borderColor        || '#D4A574',
        borderWidth:        template?.designConfig?.borderWidth        || template?.borderWidth        || 8,
        width:              template?.designConfig?.width              || 1050,
        height:             template?.designConfig?.height             || 744,
        padding:            template?.designConfig?.padding            || 40,
      },

      // ============ EDITOR STATE ============
      activeTool:  'select',
      activePanel: 'tools',
      textEditing: null,
      viewMode:    'editor',

      // ============ HISTORY ============
      history:      [],
      historyIndex: -1,

      // ============ CANVAS ACTIONS ============
      setZoom:       (zoom) => set((s) => { s.zoom = Math.max(0.1, Math.min(3, zoom)); }),
      setPan:        (panX, panY) => set((s) => { s.panX = panX; s.panY = panY; }),
      setShowGrid:   (show) => set((s) => { s.showGrid = show; }),
      setSnapToGrid: (snap) => set((s) => { s.snapToGrid = snap; }),

      // ============ SELECTION ============
      selectElement: (elementId, multiSelect = false) => set((s) => {
        if (!elementId) { s.selectedElementIds = []; return; }
        if (multiSelect) {
          if (s.selectedElementIds.includes(elementId)) {
            s.selectedElementIds = s.selectedElementIds.filter(id => id !== elementId);
          } else {
            s.selectedElementIds.push(elementId);
          }
        } else {
          s.selectedElementIds = [elementId];
        }
      }),
      clearSelection:  () => set((s) => { s.selectedElementIds = []; }),
      selectMultiple:  (ids) => set((s) => { s.selectedElementIds = ids; }),

      // ============ ELEMENTS ============
      addElement: (element) => {
        const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => {
          s.elements.push({
            id: newId,
            zIndex: s.elements.length,
            isLocked: false,
            isHidden: false,
            rotation: 0,
            opacity: 1,
            ...element,
          });
          s.selectedElementIds = [newId];
        });
        get().saveToHistory();
        return newId;
      },

      updateElement: (elementId, updates) => {
        set((s) => {
          const el = s.elements.find(e => e.id === elementId);
          if (el) Object.assign(el, updates);
        });
        get().saveToHistory();
      },

      updateElementLive: (elementId, updates) => {
        set((s) => {
          const el = s.elements.find(e => e.id === elementId);
          if (el) Object.assign(el, updates);
        });
      },

      commitLiveUpdate: () => { get().saveToHistory(); },

      updateElements: (updates) => {
        set((s) => {
          updates.forEach(({ id, changes }) => {
            const el = s.elements.find(e => e.id === id);
            if (el) Object.assign(el, changes);
          });
        });
        get().saveToHistory();
      },

      deleteElement: (elementId) => {
        set((s) => {
          s.elements = s.elements.filter(e => e.id !== elementId);
          s.selectedElementIds = s.selectedElementIds.filter(id => id !== elementId);
        });
        get().saveToHistory();
      },

      deleteSelected: () => {
        const { selectedElementIds } = get();
        if (!selectedElementIds.length) return;
        set((s) => {
          s.elements = s.elements.filter(e => !selectedElementIds.includes(e.id));
          s.selectedElementIds = [];
        });
        get().saveToHistory();
      },

      duplicateElement: (elementId) => {
        const el = get().elements.find(e => e.id === elementId);
        if (!el) return;
        const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => {
          s.elements.push({
            ...JSON.parse(JSON.stringify(el)),
            id: newId,
            x: (el.x || 0) + 20,
            y: (el.y || 0) + 20,
            zIndex: s.elements.length,
          });
          s.selectedElementIds = [newId];
        });
        get().saveToHistory();
      },

      getElement:    (id) => get().elements.find(e => e.id === id),
      getAllElements: () => get().elements,

      // ============ LAYERING ============
      bringForward: (id) => {
        set((s) => {
          const i = s.elements.findIndex(e => e.id === id);
          if (i < s.elements.length - 1)
            [s.elements[i], s.elements[i + 1]] = [s.elements[i + 1], s.elements[i]];
        });
        get().saveToHistory();
      },
      sendBackward: (id) => {
        set((s) => {
          const i = s.elements.findIndex(e => e.id === id);
          if (i > 0) [s.elements[i], s.elements[i - 1]] = [s.elements[i - 1], s.elements[i]];
        });
        get().saveToHistory();
      },
      bringToFront: (id) => {
        set((s) => {
          const i = s.elements.findIndex(e => e.id === id);
          if (i !== -1) { const [el] = s.elements.splice(i, 1); s.elements.push(el); }
        });
        get().saveToHistory();
      },
      sendToBack: (id) => {
        set((s) => {
          const i = s.elements.findIndex(e => e.id === id);
          if (i !== -1) { const [el] = s.elements.splice(i, 1); s.elements.unshift(el); }
        });
        get().saveToHistory();
      },

      toggleLock: (id) => {
        set((s) => { const el = s.elements.find(e => e.id === id); if (el) el.isLocked = !el.isLocked; });
      },
      toggleVisibility: (id) => {
        set((s) => { const el = s.elements.find(e => e.id === id); if (el) el.isHidden = !el.isHidden; });
      },

      // ============ DESIGN CONFIG ============
      updateDesignConfig: (updates) => {
        set((s) => { Object.assign(s.designConfig, updates); });
        get().saveToHistory();
      },
      getDesignConfig: () => get().designConfig,

      // ============ EDITOR STATE ============
      setActiveTool:  (tool) => set((s) => { s.activeTool = tool; if (tool !== 'text') s.textEditing = null; }),
      setActivePanel: (panel) => set((s) => { s.activePanel = panel; }),
      setTextEditing: (id)   => set((s) => { s.textEditing = id; }),
      setViewMode:    (mode) => set((s) => { s.viewMode = mode; }),

      // ============ HISTORY ============
      saveToHistory: () => {
        const current = get();
        const snapshot = {
          elements:     JSON.parse(JSON.stringify(current.elements)),
          designConfig: JSON.parse(JSON.stringify(current.designConfig)),
        };
        set((s) => {
          const newHistory = s.history.slice(0, s.historyIndex + 1);
          newHistory.push(snapshot);
          if (newHistory.length > HISTORY_LIMIT) newHistory.shift();
          s.history      = newHistory;
          s.historyIndex = newHistory.length - 1;
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;
        set((s) => {
          s.historyIndex = historyIndex - 1;
          const snap = history[historyIndex - 1];
          s.elements     = JSON.parse(JSON.stringify(snap.elements));
          s.designConfig = JSON.parse(JSON.stringify(snap.designConfig));
          s.selectedElementIds = [];
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;
        set((s) => {
          s.historyIndex = historyIndex + 1;
          const snap = history[historyIndex + 1];
          s.elements     = JSON.parse(JSON.stringify(snap.elements));
          s.designConfig = JSON.parse(JSON.stringify(snap.designConfig));
          s.selectedElementIds = [];
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // ============ SERIALIZATION ============
      serializeState: () => ({
        elements:     get().elements,
        designConfig: get().designConfig,
      }),

      // ── KEY FIX: loadState now accepts BOTH elements and designConfig ────────
      // and merges designConfig instead of replacing entirely, so the store's
      // initial designConfig (from template) is preserved for fields not in the saved config.
      loadState: (newState) => set((s) => {
        if (Array.isArray(newState.elements)) {
          s.elements = newState.elements;
        }
        if (newState.designConfig && typeof newState.designConfig === 'object') {
          // Merge — don't replace — so width/height defaults are kept if not saved
          Object.assign(s.designConfig, newState.designConfig);
        }
        // Always reset history and selection on load
        s.history            = [];
        s.historyIndex       = -1;
        s.selectedElementIds = [];
      }),

      reset: () => set((s) => {
        s.elements           = [];
        s.selectedElementIds = [];
        s.history            = [];
        s.historyIndex       = -1;
        s.zoom               = 0.7;
      }),
    }))
  );
};

export { createEditorStore };