import { Inject, Injectable, Optional } from "@angular/core";
import {
  CONFLICT_RESOLUTION_STRATEGY,
  ConflictResolutionStrategy,
} from "./conflict-resolution-strategy";

/**
 * Attempt automatic conflict resolutions or identify trivial conflicts for semi-automatic resolution.
 */
@Injectable({
  providedIn: "root",
})
export class AutoResolutionService {
  /**
   * @param resolutionStrategies The (multi = true) services registered as resolution strategies (can be none --> null)
   */
  constructor(
    @Optional()
    @Inject(CONFLICT_RESOLUTION_STRATEGY)
    private resolutionStrategies: ConflictResolutionStrategy[],
  ) {}

  /**
   * Checks whether any registered resolution strategy suggests that the conflicting version should be automatically deleted.
   *
   * This method does not delete the conflict. It only suggests whether it should be deleted automatically.
   *
   * @param currentDoc The currently active revision of the doc
   * @param conflictingDoc The conflicting revision of the doc to be checked whether it can be deleted
   */
  public shouldDeleteConflictingRevision(
    currentDoc: any,
    conflictingDoc: any,
  ): boolean {
    for (const resolutionStrategy of this.resolutionStrategies || []) {
      if (
        resolutionStrategy.autoDeleteConflictingRevision(
          currentDoc,
          conflictingDoc,
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
