import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Mock } from "vitest";
import { AdminMenuItemDetailsComponent } from "./admin-menu-item-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { ConfigService } from "app/core/config/config.service";

type ConfigServiceMock = {
  getAllConfigs: Mock;
  configUpdates: typeof NEVER;
};

type DialogRefMock = {
  close: Mock;
  afterClosed: Mock;
};

describe("AdminMenuItemDetailsComponent", () => {
  let component: AdminMenuItemDetailsComponent;
  let fixture: ComponentFixture<AdminMenuItemDetailsComponent>;
  let menuItem: MenuItem;
  let mockConfigService: ConfigServiceMock;
  let mockDialogRef: DialogRefMock;

  beforeEach(async () => {
    menuItem = {
      label: "Test",
      icon: "user",
      link: "",
    };

    mockConfigService = {
      getAllConfigs: vi.fn().mockName("ConfigService.getAllConfigs"),
      configUpdates: NEVER,
    };
    mockConfigService.getAllConfigs.mockReturnValue([]);

    mockDialogRef = {
      close: vi.fn().mockName("MatDialogRef.close"),
      afterClosed: vi.fn().mockName("MatDialogRef.afterClosed"),
    };
    mockDialogRef.afterClosed.mockReturnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [
        AdminMenuItemDetailsComponent,
        NoopAnimationsModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { item: menuItem } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ConfigService, useValue: mockConfigService },
        EntityRegistry,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenuItemDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should allow saving without a link when noLinkMode is active", () => {
    component.item = { label: "Section", icon: "folder" } as MenuItem;
    (
      component as unknown as {
        menuItemForm: { isNoLinkModeEnabled: () => boolean };
      }
    ).menuItemForm = {
      isNoLinkModeEnabled: () => true,
    };

    component.save();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Section" }),
    );
  });

  it("should not save and should show validation error when noLinkMode is inactive and link is empty", () => {
    component.item = { label: "Section", icon: "folder" } as MenuItem;
    (
      component as unknown as {
        menuItemForm: { isNoLinkModeEnabled: () => boolean };
      }
    ).menuItemForm = {
      isNoLinkModeEnabled: () => false,
    };

    component.save();

    expect(component.linkError).toBe(true);
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
