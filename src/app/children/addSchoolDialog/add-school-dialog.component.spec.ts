import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSchoolDialogComponent } from './add-school-dialog.component';

describe('AddSchoolDialogComponent', () => {
  let component: AddSchoolDialogComponent;
  let fixture: ComponentFixture<AddSchoolDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSchoolDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSchoolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
