/**
 * Conflict resolution logic for file watching
 */

import { ConflictResolution, ConflictResolutionAction } from '../utils/types';
import { Logger } from '../utils/logger';

const logger = Logger.createConflictLogger();

export interface ConflictState {
  resolution: ConflictResolution;
  externalContent: string;
  localContent: string;
}

export interface ConflictResolverCallbacks {
  onConflictDetected: (state: ConflictState) => void;
  onConflictResolved: (content: string, wasExternal: boolean) => void;
}

export class ConflictResolver {
  private callbacks: ConflictResolverCallbacks;
  private currentConflict: ConflictState | null = null;

  constructor(callbacks: ConflictResolverCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Check for conflicts between local and external content
   */
  checkForConflict(
    localContent: string,
    externalContent: string,
    hasUnsavedChanges: boolean,
    isUserEditing: boolean
  ): boolean {
    // No conflict if contents are the same
    if (localContent === externalContent) {
      return false;
    }

    // Conflict exists if user has unsaved changes and external content differs
    if (hasUnsavedChanges && localContent !== externalContent) {
      logger.log('🚨 Conflict detected: external changes while user has unsaved edits');
      
      const conflictState: ConflictState = {
        resolution: 'external',
        externalContent,
        localContent
      };

      this.currentConflict = conflictState;
      this.callbacks.onConflictDetected(conflictState);
      return true;
    }

    // No conflict if user is not actively editing and we can apply external changes
    if (!isUserEditing && localContent !== externalContent) {
      logger.log('✅ No conflict: applying external change in-place');
      this.callbacks.onConflictResolved(externalContent, true);
      return false;
    }

    // User is actively editing - defer the update but no immediate conflict
    if (isUserEditing) {
      logger.log('⏳ Deferring external change - user is editing');
      // Store for later application when user stops editing
      this.currentConflict = {
        resolution: 'none',
        externalContent,
        localContent
      };
      return false;
    }

    return false;
  }

  /**
   * Resolve a conflict with user's choice
   */
  resolveConflict(action: ConflictResolutionAction): void {
    if (!this.currentConflict) {
      logger.warn('No active conflict to resolve');
      return;
    }

    const { externalContent, localContent } = this.currentConflict;

    if (action === 'accept-external') {
      logger.log('✅ User chose to accept external changes');
      this.callbacks.onConflictResolved(externalContent, true);
    } else {
      logger.log('✅ User chose to keep local changes');
      this.callbacks.onConflictResolved(localContent, false);
    }

    this.currentConflict = null;
  }

  /**
   * Get current conflict state
   */
  getCurrentConflict(): ConflictState | null {
    return this.currentConflict;
  }

  /**
   * Clear any pending conflict
   */
  clearConflict(): void {
    if (this.currentConflict) {
      logger.log('🧹 Clearing conflict state');
      this.currentConflict = null;
    }
  }

  /**
   * Check if there's an active conflict
   */
  hasActiveConflict(): boolean {
    return this.currentConflict !== null && this.currentConflict.resolution !== 'none';
  }
}
