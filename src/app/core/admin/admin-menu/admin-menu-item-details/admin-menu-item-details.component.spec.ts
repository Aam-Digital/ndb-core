import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMenuItemDetailsComponent } from "./admin-menu-item-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NEVER } from "rxjs";
import { MenuItem } from "app/core/ui/navigation/menu-item";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { ConfigService } from "app/core/config/config.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";

describe("AdminMenuItemDetailsComponent", () => {
  let component: AdminMenuItemDetailsComponent;
  let fixture: ComponentFixture<AdminMenuItemDetailsComponent>;

  let mockDialogRef: jasmine.SpyObj<
    MatDialogRef<AdminMenuItemDetailsComponent>
  >;
  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(async () => {
    const mockConfigService = jasmine.createSpyObj("ConfigService", [
      "getAllConfigs",
    ]);
    mockConfigService.getAllConfigs.and.returnValue([]);
    mockConfigService.configUpdates = NEVER;

    mockDialogRef = jasmine.createSpyObj("MatDialogRef", [
      "close",
      "afterClosed",
    ]);
    mockDialogRef.afterClosed.and.returnValue(NEVER);

    mockConfirmationDialog = jasmine.createSpyObj("ConfirmationDialogService", [
      "getConfirmation",
    ]);
    mockConfirmationDialog.getConfirmation.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [
        AdminMenuItemDetailsComponent,
        NoopAnimationsModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { item: { label: "Test", icon: "user", link: "" } },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
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
    component.noLinkMode = true;

    component.save();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ label: "Section" }),
    );
  });

  it("should not change noLinkMode and preserve the link when confirmation is cancelled", async () => {
    component.item = {
      label: "Test",
      icon: "user",
      link: "/dashboard",
    } as MenuItem;
    component.noLinkMode = false;
    mockConfirmationDialog.getConfirmation.and.resolveTo(false);

    await component.onNoLinkModeChange(true);

    expect(component.noLinkMode).toBe(false);
    expect(component.item.link).toBe("/dashboard");
  });
});
