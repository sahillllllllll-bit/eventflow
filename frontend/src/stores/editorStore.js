import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Production-grade certificate editor store using Zustand
 * Manages canvas state, elements, history, and design configuration
 */

const HISTORY_LIMIT = 50;

const createEditorStore = (template = null) => {
  return create(
    immer((set, get) => ({
        // ============ CANVAS STATE ============
        zoom: 1,
        panX: 0,
        panY: 0,
        showGrid: false,
        showRulers: false,
        gridSize: 10,
        snapToGrid: true,

        // ============ ELEMENTS & SELECTION ============
        elements: [],
        selectedElementIds: [],
        selectedGroupId: null,
        draggedElement: null,

        // ============ DESIGN CONFIG ============
        designConfig: {
          backgroundColor: template?.backgroundColor || '#FFFFFF',
          backgroundPattern: 'solid',
          backgroundImage: null,
          borderStyle: template?.borderStyle || 'elegant',
          borderColor: template?.borderColor || '#D4A574',
          borderWidth: 8,
          width: 1050, // A4 landscape
          height: 744,
          padding: 40,
          decorativeElements: template?.decorativeElements || [],
        },

        // ============ EDITOR STATE ============
        activeTool: 'select', // select, text, image, shape, etc.
        activePanel: 'elements', // elements, design, properties
        textEditing: null, // element id being edited
        isDrawing: false,
        viewMode: 'editor', // editor, preview

        // ============ HISTORY ============
        history: [],
        historyIndex: -1,

        // ============ CANVAS ACTIONS ============
        setZoom: (zoom) => set((state) => {
          state.zoom = Math.max(0.1, Math.min(4, zoom));
        }),

        setPan: (panX, panY) => set((state) => {
          state.panX = panX;
          state.panY = panY;
        }),

        setShowGrid: (show) => set((state) => {
          state.showGrid = show;
        }),

        setShowRulers: (show) => set((state) => {
          state.showRulers = show;
        }),

        setSnapToGrid: (snap) => set((state) => {
          state.snapToGrid = snap;
        }),

        // ============ SELECTION ACTIONS ============
        selectElement: (elementId, multiSelect = false) => set((state) => {
          if (multiSelect) {
            if (state.selectedElementIds.includes(elementId)) {
              state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
            } else {
              state.selectedElementIds.push(elementId);
            }
          } else {
            state.selectedElementIds = elementId ? [elementId] : [];
          }
        }),

        clearSelection: () => set((state) => {
          state.selectedElementIds = [];
          state.selectedGroupId = null;
        }),

        selectMultiple: (elementIds) => set((state) => {
          state.selectedElementIds = elementIds;
        }),

        // ============ ELEMENT ACTIONS ============
        addElement: (element) => set((state) => {
          const newElement = {
            id: `element-${Date.now()}-${Math.random()}`,
            zIndex: state.elements.length,
            isLocked: false,
            isHidden: false,
            ...element,
          };
          state.elements.push(newElement);
          state.selectedElementIds = [newElement.id];
          get().saveToHistory();
          return newElement.id;
        }, false),

        updateElement: (elementId, updates) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            Object.assign(element, updates);
            get().saveToHistory();
          }
        }),

        updateElements: (updates) => set((state) => {
          updates.forEach(({ id, changes }) => {
            const element = state.elements.find(el => el.id === id);
            if (element) {
              Object.assign(element, changes);
            }
          });
          get().saveToHistory();
        }),

        deleteElement: (elementId) => set((state) => {
          state.elements = state.elements.filter(el => el.id !== elementId);
          state.selectedElementIds = state.selectedElementIds.filter(id => id !== elementId);
          get().saveToHistory();
        }),

        deleteSelected: () => {
          const { selectedElementIds } = get();
          selectedElementIds.forEach(id => get().deleteElement(id));
        },

        duplicateElement: (elementId) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            const newElement = {
              ...element,
              id: `element-${Date.now()}-${Math.random()}`,
              x: (element.x || 0) + 20,
              y: (element.y || 0) + 20,
              zIndex: state.elements.length,
            };
            state.elements.push(newElement);
            state.selectedElementIds = [newElement.id];
            get().saveToHistory();
          }
        }),

        getElement: (elementId) => {
          const { elements } = get();
          return elements.find(el => el.id === elementId);
        },

        getAllElements: () => get().elements,

        // ============ LAYERING ============
        bringForward: (elementId) => set((state) => {
          const index = state.elements.findIndex(el => el.id === elementId);
          if (index < state.elements.length - 1) {
            [state.elements[index], state.elements[index + 1]] = [state.elements[index + 1], state.elements[index]];
            get().saveToHistory();
          }
        }),

        sendBackward: (elementId) => set((state) => {
          const index = state.elements.findIndex(el => el.id === elementId);
          if (index > 0) {
            [state.elements[index], state.elements[index - 1]] = [state.elements[index - 1], state.elements[index]];
            get().saveToHistory();
          }
        }),

        bringToFront: (elementId) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            state.elements = state.elements.filter(el => el.id !== elementId);
            state.elements.push(element);
            get().saveToHistory();
          }
        }),

        sendToBack: (elementId) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            state.elements = state.elements.filter(el => el.id !== elementId);
            state.elements.unshift(element);
            get().saveToHistory();
          }
        }),

        // ============ ELEMENT LOCKING ============
        toggleLock: (elementId) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            element.isLocked = !element.isLocked;
            get().saveToHistory();
          }
        }),

        toggleVisibility: (elementId) => set((state) => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            element.isHidden = !element.isHidden;
            get().saveToHistory();
          }
        }),

        // ============ DESIGN CONFIG ============
        updateDesignConfig: (updates) => set((state) => {
          Object.assign(state.designConfig, updates);
          get().saveToHistory();
        }),

        getDesignConfig: () => get().designConfig,

        // ============ EDITOR STATE ============
        setActiveTool: (tool) => set((state) => {
          state.activeTool = tool;
          if (tool !== 'text') {
            state.textEditing = null;
          }
        }),

        setActivePanel: (panel) => set((state) => {
          state.activePanel = panel;
        }),

        setTextEditing: (elementId) => set((state) => {
          state.textEditing = elementId;
        }),

        setViewMode: (mode) => set((state) => {
          state.viewMode = mode;
        }),

        // ============ HISTORY & UNDO/REDO ============
        saveToHistory: () => {
          const state = get();
          const snapshot = {
            elements: JSON.parse(JSON.stringify(state.elements)),
            designConfig: JSON.parse(JSON.stringify(state.designConfig)),
          };

          // Remove any future history if we're not at the end
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(snapshot);

          // Limit history size
          if (newHistory.length > HISTORY_LIMIT) {
            newHistory.shift();
            state.history = newHistory;
            state.historyIndex = newHistory.length - 1;
          } else {
            state.history = newHistory;
            state.historyIndex = newHistory.length - 1;
          }
        },

        undo: () => {
          const state = get();
          if (state.historyIndex > 0) {
            state.historyIndex--;
            const snapshot = state.history[state.historyIndex];
            state.elements = JSON.parse(JSON.stringify(snapshot.elements));
            state.designConfig = JSON.parse(JSON.stringify(snapshot.designConfig));
            state.selectedElementIds = [];
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            const snapshot = state.history[state.historyIndex];
            state.elements = JSON.parse(JSON.stringify(snapshot.elements));
            state.designConfig = JSON.parse(JSON.stringify(snapshot.designConfig));
            state.selectedElementIds = [];
          }
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        // ============ STATE SERIALIZATION ============
        getState: () => ({
          elements: get().elements,
          designConfig: get().designConfig,
        }),

        setState: (state) => set((draft) => {
          draft.elements = state.elements || [];
          draft.designConfig = state.designConfig || draft.designConfig;
          draft.history = [];
          draft.historyIndex = -1;
        }),

        // ============ RESET ============
        reset: () => set((state) => {
          state.elements = [];
          state.selectedElementIds = [];
          state.history = [];
          state.historyIndex = -1;
          state.zoom = 1;
          state.panX = 0;
          state.panY = 0;
        }),
      }))
    );
};

export { createEditorStore };
