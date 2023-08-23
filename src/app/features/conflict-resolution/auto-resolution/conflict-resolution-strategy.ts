import { InjectionToken } from "@angular/core";

/**
 * Use this token to provide (and thereby register) custom implementations of {@link ConflictResolutionStrategy}.
 *
 * `{ provide: CONFLICT_RESOLUTION_STRATEGY, useClass: MyConflictResolutionStrategy, multi: true }`
 *
 * see {@link ConflictResolutionModule}
 */
export const CONFLICT_RESOLUTION_STRATEGY =
  new InjectionToken<ConflictResolutionStrategy>("ConflictResolutionStrategy");

/**
 * Implement this interface to provide custom strategies how certain conflicts of an Entity type can be resolved automatically.
 *
 * see {@link ConflictResolutionModule}
 */
export interface ConflictResolutionStrategy {
  autoDeleteConflictingRevision(currentDoc: any, conflictingDoc: any): boolean;
}
