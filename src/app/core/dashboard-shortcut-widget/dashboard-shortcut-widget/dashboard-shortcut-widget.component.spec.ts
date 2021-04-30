import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardShortcutWidgetComponent } from "./dashboard-shortcut-widget.component";
import { DashboardShortcutWidgetModule } from "../dashboard-shortcut-widget.module";

describe("ShortcutDashboardWidgetComponent", () => {
  let component: DashboardShortcutWidgetComponent;
  let fixture: ComponentFixture<DashboardShortcutWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardShortcutWidgetModule],
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
