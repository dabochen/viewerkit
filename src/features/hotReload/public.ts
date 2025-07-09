// Hot Reload Public API
// This file exports the public interface for the hot reload feature

// Host-side exports (for extension authors)
export { watchFile, flagInternalWrite, type WatchOptions, type FileChangeEvent } from './host';

// Web-side exports (for webview developers)
export { 
  onFileChange, 
  setupFileWatcher, 
  requestFileContent, 
  getHotReloadWebManager,
  type WebFileChangeEvent,
  type FileChangeHandler 
} from './web'; 