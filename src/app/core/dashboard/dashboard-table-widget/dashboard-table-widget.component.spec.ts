import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardTableWidgetComponent } from "./dashboard-table-widget.component";

describe("DashboardTableWidgetComponent", () => {
  let component: DashboardTableWidgetComponent;
  let fixture: ComponentFixture<DashboardTableWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardTableWidgetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardTableWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
