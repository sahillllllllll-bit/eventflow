import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for easier editor store management
 * Provides convenient access to editor state and actions
 */
export function useEditorStore(store) {
  const [state, setState] = useState(() => store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(
      (newState) => setState(newState),
      (state) => ({
        // Only subscribe to these properties
        elements: state.elements,
        selectedElementIds: state.selectedElementIds,
        designConfig: state.designConfig,
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY,
        activeTool: state.activeTool,
        activePanel: state.activePanel,
        textEditing: state.textEditing,
        showGrid: state.showGrid,
        viewMode: state.viewMode,
        history: state.history,
        historyIndex: state.historyIndex,
      })
    );

    return unsubscribe;
  }, [store]);

  return state;
}

/**
 * Hook for template serialization
 */
export function useTemplateExport(store) {
  return useCallback(() => {
    const state = store.getState();
    return {
      elements: state.elements,
      designConfig: state.designConfig,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
  }, [store]);
}

/**
 * Hook for template import
 */
export function useTemplateImport(store) {
  return useCallback((templateData) => {
    if (templateData.version !== '1.0') {
      throw new Error('Unsupported template version');
    }

    store.setState({
      elements: templateData.elements || [],
      designConfig: templateData.designConfig || {},
    });
  }, [store]);
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useEditorKeyboardShortcuts(store, state) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        store.redo();
      }
      // Ctrl/Cmd + Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        store.redo();
      }
      // Delete: Delete selected
      if (e.key === 'Delete' && state.selectedElementIds.length > 0) {
        e.preventDefault();
        store.deleteSelected();
      }
      // Escape: Clear selection
      if (e.key === 'Escape') {
        store.clearSelection();
      }
      // Ctrl/Cmd + D: Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && state.selectedElementIds.length > 0) {
        e.preventDefault();
        state.selectedElementIds.forEach(id => store.duplicateElement(id));
      }
      // Arrow keys: Move selected elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const step = e.shiftKey ? 10 : 2;
        e.preventDefault();
        state.selectedElementIds.forEach(id => {
          const element = store.getElement(id);
          if (element) {
            const updates = {};
            if (e.key === 'ArrowUp') updates.y = (element.y || 0) - step;
            if (e.key === 'ArrowDown') updates.y = (element.y || 0) + step;
            if (e.key === 'ArrowLeft') updates.x = (element.x || 0) - step;
            if (e.key === 'ArrowRight') updates.x = (element.x || 0) + step;
            store.updateElement(id, updates);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, state.selectedElementIds]);
}

/**
 * Hook for auto-save functionality
 */
export function useAutoSave(store, onSave, debounceMs = 1000) {
  const [saveTimer, setSaveTimer] = useState(null);

  useEffect(() => {
    // Clear existing timer
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    // Set new timer for auto-save
    const timer = setTimeout(async () => {
      try {
        const state = store.getState();
        await onSave(state);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, debounceMs);

    setSaveTimer(timer);

    // Cleanup
    return () => clearTimeout(timer);
  }, [store, onSave, debounceMs]);
}

/**
 * Hook for drag and drop file upload
 */
export function useFileDragDrop(onFiles) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      onFiles(files);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [onFiles]);

  return { isDragging };
}
