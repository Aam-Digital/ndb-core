import { TestBed } from '@angular/core/testing';

import { ConflictResolutionStrategyService } from './conflict-resolution-strategy.service';
import { AttendanceMonth } from '../../child-dev-project/attendance/model/attendance-month';
import { AttendanceDay, AttendanceStatus } from '../../child-dev-project/attendance/model/attendance-day';

describe('ConflictResolutionStrategyService', () => {
  let service: ConflictResolutionStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.get(ConflictResolutionStrategyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should delete irrelevant attendance diff conflicts', () => {
    const currentDoc = new AttendanceMonth('test1');
    currentDoc.month = new Date(2019, 0);
    currentDoc.dailyRegister[0] = new AttendanceDay(new Date(2019, 0, 1), AttendanceStatus.ABSENT);

    const conflictingDoc = new AttendanceMonth('test1');
    conflictingDoc.month = new Date(2019, 0);
    // no dailyRegister entries set

    const result = service.isIrrelevantConflictVersion(currentDoc, conflictingDoc);
    expect(result).toBe(true);
  });

  it('should not delete complex attendance diff conflicts', () => {
    const currentDoc = new AttendanceMonth('test1');
    currentDoc.month = new Date(2019, 0);
    currentDoc.dailyRegister[0] = new AttendanceDay(new Date(2019, 0, 1), AttendanceStatus.ABSENT);

    const conflictingDoc = new AttendanceMonth('test1');
    conflictingDoc.month = new Date(2019, 0);
    conflictingDoc.dailyRegister[1] = new AttendanceDay(new Date(2019, 0, 1), AttendanceStatus.EXCUSED);

    const result = service.isIrrelevantConflictVersion(currentDoc, conflictingDoc);
    expect(result).toBe(false);
  });
});
