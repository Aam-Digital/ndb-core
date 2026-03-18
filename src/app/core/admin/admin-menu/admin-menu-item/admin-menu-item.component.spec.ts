import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMenuItemComponent } from "./admin-menu-item.component";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MenuItemForAdminUi } from "../menu-item-for-admin-ui";

describe("AdminMenuItemComponent", () => {
  let component: AdminMenuItemComponent;
  let fixture: ComponentFixture<AdminMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMenuItemComponent, FontAwesomeTestingModule],
      providers: [{ provide: MenuService, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show warning when item has no link and no sub-items", () => {
    component["_item"] = {
      uniqueId: "1",
      label: "Section",
      icon: "folder",
      subMenu: [],
    } as MenuItemForAdminUi;
    expect(component.hasNoLinkWarning).toBe(true);
  });

  it("should not show warning when item has a link or has sub-items", () => {
    component["_item"] = {
      uniqueId: "1",
      label: "Dashboard",
      icon: "home",
      link: "/dashboard",
      subMenu: [],
    } as MenuItemForAdminUi;
    expect(component.hasNoLinkWarning).toBe(false);

    const child = {
      uniqueId: "2",
      label: "Child",
      icon: "user",
      link: "/child",
      subMenu: [],
    } as MenuItemForAdminUi;
    component["_item"] = {
      uniqueId: "1",
      label: "Section",
      icon: "folder",
      subMenu: [child],
    } as MenuItemForAdminUi;
    expect(component.hasNoLinkWarning).toBe(false);
  });
});
