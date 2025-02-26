import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkMergeRecordsComponent } from './bulk-merge-records.component';

describe('BulkMergeRecordsComponent', () => {
  let component: BulkMergeRecordsComponent;
  let fixture: ComponentFixture<BulkMergeRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkMergeRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkMergeRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
