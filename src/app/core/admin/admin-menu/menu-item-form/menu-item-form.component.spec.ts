import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MenuItemFormComponent } from "./menu-item-form.component";
import { MenuItem } from "../../../ui/navigation/menu-item";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("MenuItemFormComponent", () => {
  let component: MenuItemFormComponent;
  let fixture: ComponentFixture<MenuItemFormComponent>;

  const mockLinkOptions = [
    { value: "/dashboard", label: "Dashboard" },
    { value: "/child", label: "Children" },
    { value: "/school", label: "Schools" },
    { value: "/attendance", label: "Attendance" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemFormComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuItemFormComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    component.item = {
      label: "Test",
      icon: "test-icon",
      link: "/test",
    } as MenuItem;

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should automatically switch to manual mode when link value is not in dropdown options (e.g. child/new, public form IDs)", () => {
    // Test with child/new type link
    component.item = {
      label: "Add New Child",
      icon: "plus",
      link: "/child/new",
    } as MenuItem;
    component.linkOptions = mockLinkOptions;

    component.ngOnInit();

    expect(component.customLinkMode).toBe(true);

    // Test with public form ID type link
    component.customLinkMode = false; // reset
    component.item = {
      label: "Registration Form",
      icon: "form",
      link: "/public-form/registration-abc123",
    } as MenuItem;

    component.ngOnInit();

    expect(component.customLinkMode).toBe(true);
  });

  it("should stay in dropdown mode when link value exists in options", () => {
    component.item = {
      label: "Dashboard",
      icon: "dashboard",
      link: "/dashboard",
    } as MenuItem;
    component.linkOptions = mockLinkOptions;

    component.ngOnInit();

    expect(component.customLinkMode).toBe(false);
  });
});
