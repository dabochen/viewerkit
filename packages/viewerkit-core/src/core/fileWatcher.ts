/**
 * Core file watching logic for ViewerKit
 */

import { FileState, FileWatcherConfig } from '../utils/types';
import { Logger } from '../utils/logger';
import { Debouncer } from '../utils/debouncer';
import { MessageHandler, MessageHandlerCallbacks } from './messageHandler';
import { ConflictResolver, ConflictResolverCallbacks, ConflictState } from './conflictResolver';

const logger = Logger.createFileWatcherLogger();
const autosaveLogger = Logger.createAutosaveLogger();

export interface FileWatcherCallbacks {
  onStateChange: (state: FileState) => void;
  onConflictDetected: (conflict: ConflictState) => void;
}

export class FileWatcher {
  private state: FileState;
  private config: FileWatcherConfig;
  private callbacks: FileWatcherCallbacks;
  
  // Core components
  private messageHandler: MessageHandler;
  private conflictResolver: ConflictResolver;
  private autosaveDebouncer: Debouncer;
  
  // Tracking refs (equivalent to React refs)
  private isUserEditingRef = { current: false };
  private isInitializedRef = { current: false };
  private pendingSaveRef = { current: null as string | null };
  private lastWebviewSaveRef = { current: '' };
  private lastSavedContentRef = { current: '' };
  private lastExternalUpdateRef = { current: '' };
  private editingTimeoutId: NodeJS.Timeout | null = null;

  constructor(callbacks: FileWatcherCallbacks, config: FileWatcherConfig = {}) {
    this.callbacks = callbacks;
    this.config = {
      debounceMs: 400,
      enableLogging: true,
      ...config
    };

    // Initialize state
    this.state = {
      filePath: '',
      data: '',
      error: null,
      hasUnsavedChanges: false,
      lastSavedContent: '',
      conflictResolution: 'none'
    };

    // Initialize debouncer
    this.autosaveDebouncer = new Debouncer(this.config.debounceMs);

    // Initialize message handler
    const messageCallbacks: MessageHandlerCallbacks = {
      onFileUpdate: this.handleFileUpdate.bind(this),
      onError: this.handleError.bind(this)
    };
    this.messageHandler = new MessageHandler(messageCallbacks);

    // Initialize conflict resolver
    const conflictCallbacks: ConflictResolverCallbacks = {
      onConflictDetected: this.handleConflictDetected.bind(this),
      onConflictResolved: this.handleConflictResolved.bind(this)
    };
    this.conflictResolver = new ConflictResolver(conflictCallbacks);
  }

  /**
   * Start the file watcher
   */
  start(): void {
    logger.log('🚀 Starting file watcher');
    this.messageHandler.start();
  }

  /**
   * Stop the file watcher
   */
  stop(): void {
    logger.log('🛑 Stopping file watcher');
    this.messageHandler.stop();
    this.autosaveDebouncer.cancel();
    
    if (this.editingTimeoutId) {
      clearTimeout(this.editingTimeoutId);
      this.editingTimeoutId = null;
    }
  }

  /**
   * Update file content (user editing)
   */
  updateContent(newContent: string): void {
    autosaveLogger.log('📝 updateContent called');
    
    // Only update if content actually changed
    if (newContent === this.state.data) {
      return;
    }

    logger.log('📝 Content updated by user:', newContent.substring(0, 50) + '...');

    // Update state
    this.setState({
      data: newContent,
      hasUnsavedChanges: newContent !== this.lastSavedContentRef.current
    });

    // Mark user as actively editing
    this.markUserEditing();

    // Trigger autosave if content has changed
    if (newContent !== this.lastSavedContentRef.current) {
      this.scheduleAutosave(newContent);
    }
  }

  /**
   * Save content manually
   */
  async saveContent(content?: string): Promise<void> {
    const contentToSave = content || this.state.data;
    
    autosaveLogger.log('💾 Starting save process:', contentToSave.substring(0, 50) + '...');
    
    // Track this as our own save to prevent feedback loop
    autosaveLogger.log('🏷️ Tracking save to prevent feedback loop');
    this.lastWebviewSaveRef.current = contentToSave;
    this.pendingSaveRef.current = contentToSave;
    
    // Send save request
    autosaveLogger.log('📤 Sending save request to VS Code extension');
    this.messageHandler.sendSaveRequest(contentToSave, this.state.filePath);
    
    // Clear pending save after delay
    setTimeout(() => {
      autosaveLogger.log('🧹 Clearing pending save');
      this.pendingSaveRef.current = null;
    }, 200);
  }

  /**
   * Resolve conflict with user choice
   */
  resolveConflict(action: 'keep-local' | 'accept-external'): void {
    this.conflictResolver.resolveConflict(action);
  }

  /**
   * Get current state
   */
  getState(): FileState {
    return { ...this.state };
  }

  // Private methods

  private setState(updates: Partial<FileState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange(this.state);
  }

  private handleFileUpdate(content: string, filePath: string): void {
    const currentContent = this.state.data;
    
    // Initial load or file path change
    if (!this.isInitializedRef.current || !this.state.filePath || filePath !== this.state.filePath) {
      logger.log('📁 Initial load:', filePath);
      this.setState({
        data: content,
        filePath,
        lastSavedContent: content,
        hasUnsavedChanges: false,
        error: null,
        conflictResolution: 'none'
      });
      
      this.lastSavedContentRef.current = content;
      this.lastExternalUpdateRef.current = content;
      this.lastWebviewSaveRef.current = content;
      this.isInitializedRef.current = true;
      return;
    }

    // Check if this update is from our own webview save
    const isOurSave = content === this.lastWebviewSaveRef.current;
    
    if (isOurSave) {
      // This is feedback from our own save
      autosaveLogger.log('📥 Received feedback from our own save - updating tracking only');
      
      this.setState({
        lastSavedContent: content,
        hasUnsavedChanges: currentContent !== content
      });
      
      this.lastSavedContentRef.current = content;
      this.lastExternalUpdateRef.current = content;
      
      autosaveLogger.log('✅ Autosave feedback processing complete');
      return;
    }

    // This is a genuine external change - check for conflicts
    logger.log('🔄 External change detected');
    
    this.conflictResolver.checkForConflict(
      currentContent,
      content,
      this.state.hasUnsavedChanges,
      this.isUserEditingRef.current
    );
  }

  private handleError(error: string): void {
    logger.error('File error:', error);
    this.setState({ error });
  }

  private handleConflictDetected(conflict: ConflictState): void {
    logger.log('🚨 Conflict detected, notifying UI');
    this.setState({ conflictResolution: conflict.resolution });
    this.callbacks.onConflictDetected(conflict);
  }

  private handleConflictResolved(content: string, wasExternal: boolean): void {
    logger.log('✅ Conflict resolved:', wasExternal ? 'external' : 'local');
    
    this.setState({
      data: content,
      lastSavedContent: wasExternal ? content : this.state.lastSavedContent,
      hasUnsavedChanges: wasExternal ? false : (content !== this.lastSavedContentRef.current),
      conflictResolution: 'none'
    });

    if (wasExternal) {
      this.lastSavedContentRef.current = content;
      this.lastExternalUpdateRef.current = content;
    }
  }

  private markUserEditing(): void {
    this.isUserEditingRef.current = true;
    
    // Clear existing timeout
    if (this.editingTimeoutId) {
      clearTimeout(this.editingTimeoutId);
    }
    
    // Clear the "user is editing" flag after delay
    this.editingTimeoutId = setTimeout(() => {
      this.isUserEditingRef.current = false;
      this.editingTimeoutId = null;
    }, 1000);
  }

  private scheduleAutosave(content: string): void {
    // Don't autosave if not ready
    if (!this.isInitializedRef.current || !content || !this.state.filePath) {
      autosaveLogger.log('⏭️ Skipping autosave - not ready');
      return;
    }
    
    // Don't autosave if content hasn't changed
    if (content === this.lastSavedContentRef.current) {
      autosaveLogger.log('⏭️ Skipping autosave - content unchanged');
      return;
    }
    
    // Don't autosave if we have a pending save for the same content
    if (this.pendingSaveRef.current === content) {
      autosaveLogger.log('⏭️ Skipping autosave - pending save for same content');
      return;
    }
    
    autosaveLogger.log('⏰ Scheduling autosave for:', content.substring(0, 50) + '...');
    
    this.autosaveDebouncer.debounce(() => {
      autosaveLogger.log('🚀 Autosave triggered');
      this.saveContent(content);
    });
  }
}
