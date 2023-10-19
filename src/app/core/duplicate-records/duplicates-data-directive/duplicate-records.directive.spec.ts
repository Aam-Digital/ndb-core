import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DuplicateRecordsDirective } from './duplicate-records.directive';
import { DuplicateRecordsService } from '../duplicate-records.service';

describe('DuplicateRecordsDirective', () => {
  let directive: DuplicateRecordsDirective;
  let duplicateRecordsService: DuplicateRecordsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DuplicateRecordsService]
    });
    duplicateRecordsService = TestBed.inject(DuplicateRecordsService);
    directive = new DuplicateRecordsDirective(duplicateRecordsService);
  });

  it('should call getDataforDuplicate on click', () => {
    spyOn(duplicateRecordsService, 'getDataforDuplicate');
    directive.data = [];
    directive.click();
    expect(duplicateRecordsService.getDataforDuplicate).toHaveBeenCalledWith(directive.data);
  });
});
