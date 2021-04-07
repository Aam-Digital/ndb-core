import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";

describe("ShortcutDashboardWidgetComponent", () => {
  let component: DashboardShortcutWidgetComponent;
  let fixture: ComponentFixture<DashboardShortcutWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardShortcutWidgetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardShortcutWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
