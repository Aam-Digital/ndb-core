import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSchoolHistoryDialogComponent } from './show-school-history-dialog.component';

describe('ShowSchoolHistoryDialogComponent', () => {
  let component: ShowSchoolHistoryDialogComponent;
  let fixture: ComponentFixture<ShowSchoolHistoryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowSchoolHistoryDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowSchoolHistoryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
