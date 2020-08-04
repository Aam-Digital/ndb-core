import { Injectable } from "@angular/core";
import { ConflictResolutionStrategy } from "../../conflict-resolution/auto-resolution/conflict-resolution-strategy";
import { AttendanceMonth } from "./model/attendance-month";
import _ from "lodash";
import { diff } from "deep-object-diff";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";

/**
 * Auto resolve simple database document conflicts concerning {@link AttendanceMonth} entities.
 */
@Injectable()
export class AttendanceMonthConflictResolutionStrategy
  implements ConflictResolutionStrategy {
  constructor(private entitySchemaService: EntitySchemaService) {}

  /**
   * Checks if the given conflict is about AttendanceMonth entities (otherwise this strategy doesn't apply)
   * and suggests whether the conflict is trivial and can be automatically deleted.
   * @param currentDoc The currently active revision
   * @param conflictingDoc The conflicting revision to be checked whether it can be deleted
   */
  public autoDeleteConflictingRevision(
    currentDoc: any,
    conflictingDoc: any
  ): boolean {
    if (!currentDoc._id.startsWith(AttendanceMonth.ENTITY_TYPE)) {
      return false;
    }

    if (typeof currentDoc.getId === "function") {
      currentDoc = this.entitySchemaService.transformEntityToDatabaseFormat(
        currentDoc
      );
    }
    if (typeof conflictingDoc.getId === "function") {
      conflictingDoc = this.entitySchemaService.transformEntityToDatabaseFormat(
        conflictingDoc
      );
    }

    const currentDocC = _.merge({}, currentDoc);
    delete currentDocC._rev;
    const conflictingDocC = _.merge({}, conflictingDoc);
    delete conflictingDocC._rev;

    return this.isIrrelevantAttendanceMonthConflict(
      currentDocC,
      conflictingDocC
    );
  }

  /**
   * Calculate a diff between the two objects discarding trivial differences.
   * @param currentDoc The object to compare against
   * @param conflictingDoc The conflicting object version to compare
   */
  private isIrrelevantAttendanceMonthConflict(
    currentDoc: any,
    conflictingDoc: any
  ): boolean {
    const diffObject = diff(currentDoc, conflictingDoc);

    const simplifiedDiff = this.removeTrivialDiffValuesRecursively(diffObject, [
      "?",
      "",
      undefined,
      null,
    ]);

    console.log(currentDoc);
    console.log(conflictingDoc);
    console.log("isIrrelevantAttendanceMonthConflict", simplifiedDiff);

    return _.isObjectLike(simplifiedDiff) && _.isEmpty(simplifiedDiff);
  }

  /**
   * Changes the given object, deep scanning it to remove any values given as the second argument.
   * @param diffObject
   * @param trivialValues
   */
  private removeTrivialDiffValuesRecursively(
    diffObject: any,
    trivialValues: any[]
  ) {
    for (const k of Object.keys(diffObject)) {
      if (trivialValues.includes(diffObject[k])) {
        delete diffObject[k];
      }

      if (typeof diffObject[k] === "object" && diffObject[k] !== null) {
        this.removeTrivialDiffValuesRecursively(diffObject[k], trivialValues);

        if (_.isObjectLike(diffObject[k]) && _.isEmpty(diffObject[k])) {
          delete diffObject[k];
        }
      }
    }

    return diffObject;
  }
}
