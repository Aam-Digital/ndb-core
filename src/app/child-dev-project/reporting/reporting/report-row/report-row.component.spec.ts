import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportRowComponent } from './report-row.component';

describe('ReportRowComponent', () => {
  let component: ReportRowComponent;
  let fixture: ComponentFixture<ReportRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportRowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
