import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ShortcutDashboardSettingsComponent } from "./shortcut-dashboard-settings.component";
import { MenuService } from "#src/app/core/ui/navigation/menu.service";

describe("ShortcutDashboardSettingsComponent", () => {
  let component: ShortcutDashboardSettingsComponent;
  let fixture: ComponentFixture<ShortcutDashboardSettingsComponent>;
  let mockMenuService: jasmine.SpyObj<MenuService>;

  beforeEach(async () => {
    mockMenuService = jasmine.createSpyObj("MenuService", [
      "loadAvailableRoutes",
    ]);
    mockMenuService.loadAvailableRoutes.and.returnValue([
      { value: "/child", label: "Child" },
      { value: "/school", label: "School" },
      { value: "/", label: "Dashboard" },
    ]);
    await TestBed.configureTestingModule({
      imports: [ShortcutDashboardSettingsComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      shortcuts: [],
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
