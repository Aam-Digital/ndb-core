import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MenuItemComponent } from "./menu-item.component";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { MenuItem } from "../menu-item";

describe("MenuItemComponent", () => {
  let component: MenuItemComponent;
  let fixture: ComponentFixture<MenuItemComponent>;

  function setup(item: MenuItem, activeLink?: string) {
    fixture = TestBed.createComponent(MenuItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("item", item);
    if (activeLink !== undefined) {
      fixture.componentRef.setInput("activeLink", activeLink);
    }
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemComponent, MockedTestingModule.withState()],
    }).compileComponents();
  });

  it("should create", () => {
    setup({ label: "Home", link: "/dashboard" });
    expect(component).toBeTruthy();
  });

  it("linkPath returns full link when there are no query params", () => {
    setup({ label: "Home", link: "/dashboard" });
    expect(component.linkPath()).toBe("/dashboard");
  });

  it("linkPath returns only path when link contains query params", () => {
    setup({ label: "Users", link: "/user?type=X" });
    expect(component.linkPath()).toBe("/user");
  });

  it("linkPath returns undefined when item has no link", () => {
    setup({ label: "Section" });
    expect(component.linkPath()).toBeUndefined();
  });

  it("linkQueryParams returns undefined when link has no query string", () => {
    setup({ label: "Home", link: "/dashboard" });
    expect(component.linkQueryParams()).toBeUndefined();
  });

  it("linkQueryParams returns parsed object when link has a single query param", () => {
    setup({ label: "Users", link: "/user?type=X" });
    expect(component.linkQueryParams()).toEqual({ type: "X" });
  });

  it("linkQueryParams returns all params when link has multiple query params", () => {
    setup({ label: "Users", link: "/user?type=X&status=active" });
    expect(component.linkQueryParams()).toEqual({
      type: "X",
      status: "active",
    });
  });

  it("linkQueryParams returns undefined when item has no link", () => {
    setup({ label: "Section" });
    expect(component.linkQueryParams()).toBeUndefined();
  });
});
