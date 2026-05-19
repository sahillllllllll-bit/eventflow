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
      designConfig: {
        backgroundColor: template?.backgroundColor || '#FFFFFF',
        backgroundGradient: template?.backgroundGradient || null,
        borderStyle: template?.borderStyle || 'elegant',
        borderColor: template?.borderColor || '#D4A574',
        borderWidth: template?.borderWidth || 8,
        width: 1050,
        height: 744,
        padding: 40,
      },

      // ============ EDITOR STATE ============
      activeTool: 'select',
      activePanel: 'tools',
      textEditing: null,
      viewMode: 'editor',

      // ============ HISTORY ============
      history: [],
      historyIndex: -1,

      // ============ CANVAS ACTIONS ============
      setZoom: (zoom) => set((state) => { state.zoom = Math.max(0.1, Math.min(3, zoom)); }),
      setPan: (panX, panY) => set((state) => { state.panX = panX; state.panY = panY; }),
      setShowGrid: (show) => set((state) => { state.showGrid = show; }),
      setSnapToGrid: (snap) => set((state) => { state.snapToGrid = snap; }),

      // ============ SELECTION ============
      selectElement: (elementId, multiSelect = false) => set((state) => {
        if (!elementId) { state.selectedElementIds = []; return; }
        if (multiSelect) {
          if (state.selectedElementIds.includes(elementId)) {
            state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
          } else {
            state.selectedElementIds.push(elementId);
          }
        } else {
          state.selectedElementIds = [elementId];
        }
      }),
      clearSelection: () => set((state) => { state.selectedElementIds = []; }),
      selectMultiple: (ids) => set((state) => { state.selectedElementIds = ids; }),

      // ============ ELEMENTS ============
      addElement: (element) => {
        const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((state) => {
          state.elements.push({
            id: newId,
            zIndex: state.elements.length,
            isLocked: false,
            isHidden: false,
            rotation: 0,
            opacity: 1,
            ...element,
          });
          state.selectedElementIds = [newId];
        });
        get().saveToHistory();
        return newId;
      },

      updateElement: (elementId, updates) => {
        set((state) => {
          const el = state.elements.find(e => e.id === elementId);
          if (el) Object.assign(el, updates);
        });
        get().saveToHistory();
      },

      // Live update during drag/resize (no history save)
      updateElementLive: (elementId, updates) => {
        set((state) => {
          const el = state.elements.find(e => e.id === elementId);
          if (el) Object.assign(el, updates);
        });
      },

      // Call after drag/resize ends
      commitLiveUpdate: () => { get().saveToHistory(); },

      updateElements: (updates) => {
        set((state) => {
          updates.forEach(({ id, changes }) => {
            const el = state.elements.find(e => e.id === id);
            if (el) Object.assign(el, changes);
          });
        });
        get().saveToHistory();
      },

      deleteElement: (elementId) => {
        set((state) => {
          state.elements = state.elements.filter(e => e.id !== elementId);
          state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
        });
        get().saveToHistory();
      },

      deleteSelected: () => {
        const { selectedElementIds } = get();
        if (!selectedElementIds.length) return;
        set((state) => {
          state.elements = state.elements.filter(e => !selectedElementIds.includes(e.id));
          state.selectedElementIds = [];
        });
        get().saveToHistory();
      },

      duplicateElement: (elementId) => {
        const el = get().elements.find(e => e.id === elementId);
        if (!el) return;
        const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((state) => {
          state.elements.push({
            ...JSON.parse(JSON.stringify(el)),
            id: newId,
            x: (el.x || 0) + 20,
            y: (el.y || 0) + 20,
            zIndex: state.elements.length,
          });
          state.selectedElementIds = [newId];
        });
        get().saveToHistory();
      },

      getElement: (id) => get().elements.find(e => e.id === id),
      getAllElements: () => get().elements,

      // ============ LAYERING ============
      bringForward: (id) => {
        set((state) => {
          const i = state.elements.findIndex(e => e.id === id);
          if (i < state.elements.length - 1) {
            [state.elements[i], state.elements[i + 1]] = [state.elements[i + 1], state.elements[i]];
          }
        });
        get().saveToHistory();
      },
      sendBackward: (id) => {
        set((state) => {
          const i = state.elements.findIndex(e => e.id === id);
          if (i > 0) [state.elements[i], state.elements[i - 1]] = [state.elements[i - 1], state.elements[i]];
        });
        get().saveToHistory();
      },
      bringToFront: (id) => {
        set((state) => {
          const i = state.elements.findIndex(e => e.id === id);
          if (i !== -1) { const [el] = state.elements.splice(i, 1); state.elements.push(el); }
        });
        get().saveToHistory();
      },
      sendToBack: (id) => {
        set((state) => {
          const i = state.elements.findIndex(e => e.id === id);
          if (i !== -1) { const [el] = state.elements.splice(i, 1); state.elements.unshift(el); }
        });
        get().saveToHistory();
      },

      toggleLock: (id) => {
        set((state) => { const el = state.elements.find(e => e.id === id); if (el) el.isLocked = !el.isLocked; });
      },
      toggleVisibility: (id) => {
        set((state) => { const el = state.elements.find(e => e.id === id); if (el) el.isHidden = !el.isHidden; });
      },

      // ============ DESIGN CONFIG ============
      updateDesignConfig: (updates) => {
        set((state) => { Object.assign(state.designConfig, updates); });
        get().saveToHistory();
      },
      getDesignConfig: () => get().designConfig,

      // ============ EDITOR STATE ============
      setActiveTool: (tool) => set((state) => { state.activeTool = tool; if (tool !== 'text') state.textEditing = null; }),
      setActivePanel: (panel) => set((state) => { state.activePanel = panel; }),
      setTextEditing: (id) => set((state) => { state.textEditing = id; }),
      setViewMode: (mode) => set((state) => { state.viewMode = mode; }),

      // ============ HISTORY ============
      saveToHistory: () => {
        const current = get();
        const snapshot = {
          elements: JSON.parse(JSON.stringify(current.elements)),
          designConfig: JSON.parse(JSON.stringify(current.designConfig)),
        };
        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(snapshot);
          if (newHistory.length > HISTORY_LIMIT) newHistory.shift();
          state.history = newHistory;
          state.historyIndex = newHistory.length - 1;
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;
        set((state) => {
          state.historyIndex = historyIndex - 1;
          const snap = history[historyIndex - 1];
          state.elements = JSON.parse(JSON.stringify(snap.elements));
          state.designConfig = JSON.parse(JSON.stringify(snap.designConfig));
          state.selectedElementIds = [];
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;
        set((state) => {
          state.historyIndex = historyIndex + 1;
          const snap = history[historyIndex + 1];
          state.elements = JSON.parse(JSON.stringify(snap.elements));
          state.designConfig = JSON.parse(JSON.stringify(snap.designConfig));
          state.selectedElementIds = [];
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      // ============ SERIALIZATION ============
      serializeState: () => ({ elements: get().elements, designConfig: get().designConfig }),

      loadState: (newState) => set((state) => {
        state.elements = newState.elements || [];
        state.designConfig = { ...state.designConfig, ...(newState.designConfig || {}) };
        state.history = [];
        state.historyIndex = -1;
        state.selectedElementIds = [];
      }),

      reset: () => set((state) => {
        state.elements = [];
        state.selectedElementIds = [];
        state.history = [];
        state.historyIndex = -1;
        state.zoom = 0.7;
      }),
    }))
  );
};

export { createEditorStore };