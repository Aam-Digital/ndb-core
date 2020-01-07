import { Injectable } from '@angular/core';
import { diff } from 'deep-object-diff';
import _ from 'lodash';
import { AttendanceMonth } from '../../child-dev-project/attendance/model/attendance-month';

/**
 * Attempt automatic conflict resolutions or identify trivial conflicts for semi-automatic resolution.
 */
@Injectable({
  providedIn: 'root'
})
export class ConflictResolutionStrategyService {

  constructor() { }

  public isIrrelevantConflictVersion(currentDoc: any, conflictingDoc: any): boolean {
    const currentDocC = _.merge({}, currentDoc);
    delete currentDocC._rev;
    const conflictingDocC = _.merge({}, conflictingDoc);
    delete conflictingDocC._rev;

    if (currentDocC._id.startsWith(AttendanceMonth.ENTITY_TYPE)) {
      return this.isIrrelevantAttendanceMonthConflict(currentDocC, conflictingDocC);
    }

    return false;
  }


  private isIrrelevantAttendanceMonthConflict(currentDoc: any, conflictingDoc: any): boolean {
    const diffObject = diff(currentDoc, conflictingDoc);

    const simplifiedDiff = this.removeTrivialDiffValuesRecursively(diffObject, ['?', '', undefined, null]);

    return _.isObjectLike(simplifiedDiff) && _.isEmpty(simplifiedDiff);
  }

  /**
   * Changes the given object, deep scanning it to remove any values given as the second argument.
   * @param diffObject
   * @param trivialValues
   */
  private removeTrivialDiffValuesRecursively(diffObject: any, trivialValues: any[]) {
    for (const k of Object.keys(diffObject)) {
      if (trivialValues.includes(diffObject[k])) {
        delete diffObject[k];
      }

      if (typeof diffObject[k] === 'object' && diffObject[k] !== null) {
        this.removeTrivialDiffValuesRecursively(diffObject[k], trivialValues);

        if (_.isObjectLike(diffObject[k]) && _.isEmpty(diffObject[k])) {
          delete diffObject[k];
        }
      }
    }

    return diffObject;
  }
}
