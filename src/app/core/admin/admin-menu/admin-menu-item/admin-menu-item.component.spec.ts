import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMenuItemComponent } from "./admin-menu-item.component";
import { MenuService } from "app/core/ui/navigation/menu.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MenuItemForAdminUi } from "../menu-item-for-admin-ui";
import { provideRouter } from "@angular/router";
import { Angulartics2Module } from "angulartics2";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import type { Mock } from "vitest";

describe("AdminMenuItemComponent", () => {
  let component: AdminMenuItemComponent;
  let fixture: ComponentFixture<AdminMenuItemComponent>;
  let mockDialog: { open: Mock };

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }),
    };
    await TestBed.configureTestingModule({
      imports: [
        AdminMenuItemComponent,
        FontAwesomeTestingModule,
        Angulartics2Module.forRoot(),
      ],
      providers: [
        {
          provide: MenuService,
          useValue: { generateMenuItemForEntityType: () => [] },
        },
        { provide: MatDialog, useValue: mockDialog },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("item", {
      uniqueId: "0",
      label: "",
      icon: "",
      subMenu: [],
    } as MenuItemForAdminUi);
    fixture.detectChanges();
  });

  it("should show warning when item has no link and no sub-items", () => {
    fixture.componentRef.setInput("item", {
      uniqueId: "1",
      label: "Section",
      icon: "folder",
      subMenu: [],
    } as MenuItemForAdminUi);
    expect(component.hasNoLinkWarning()).toBe(true);
  });

  it("should not show warning when item has a link or has sub-items", () => {
    fixture.componentRef.setInput("item", {
      uniqueId: "1",
      label: "Dashboard",
      icon: "home",
      link: "/dashboard",
      subMenu: [],
    } as MenuItemForAdminUi);
    expect(component.hasNoLinkWarning()).toBe(false);

    // sub-items are rendered as rows of their own, the editor reports them via `hasSubItems`
    fixture.componentRef.setInput("item", {
      uniqueId: "1",
      label: "Section",
      icon: "folder",
      subMenu: [],
    } as MenuItemForAdminUi);
    fixture.componentRef.setInput("hasSubItems", true);
    expect(component.hasNoLinkWarning()).toBe(false);
  });

  it("should pass the allowEntityLinks value, not the input signal, to the edit dialog", async () => {
    fixture.componentRef.setInput("allowEntityLinks", false);

    await component.editMenuItem(component.item());

    expect(mockDialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({ allowEntityLinks: false }),
      }),
    );
  });
});
