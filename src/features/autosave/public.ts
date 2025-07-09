// Autosave Public API
// This file exports the public interface for the autosave feature

// Host-side exports (for extension authors)
export { 
  autosave as hostAutosave, 
  cancelAutosave as hostCancelAutosave,
  getAutosaveManager,
  type AutosaveOptions,
  type AutosaveResult 
} from './host';

// Web-side exports (for webview developers)
export { 
  autosave as webAutosave, 
  cancelAutosave as webCancelAutosave,
  useAutosave,
  getWebAutosaveManager,
  type WebAutosaveOptions,
  type WebAutosaveResult 
} from './web'; 