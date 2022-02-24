import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SelectReportComponent } from "./select-report.component";

describe("SelectReportComponent", () => {
  let component: SelectReportComponent;
  let fixture: ComponentFixture<SelectReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
