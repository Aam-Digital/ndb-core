import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReportRowComponent } from "./report-row.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTableModule } from "@angular/material/table";

describe("ReportRowComponent", () => {
  let component: ReportRowComponent;
  let fixture: ComponentFixture<ReportRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportRowComponent],
      imports: [MatExpansionModule, MatTableModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
