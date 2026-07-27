import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialog } from "@angular/material/dialog";
import { FeaturePermissionBannerComponent } from "./feature-permission-banner.component";
import { FeaturePermissionService } from "../feature-permission.service";
import { FeaturePermissionDialogComponent } from "../feature-permission-dialog/feature-permission-dialog.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("FeaturePermissionBannerComponent", () => {
  let fixture: ComponentFixture<FeaturePermissionBannerComponent>;
  let component: FeaturePermissionBannerComponent;
  let mockPermissionService: { hasAdminPermission: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  function createComponent() {
    fixture = TestBed.createComponent(FeaturePermissionBannerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mockPermissionService = {
      hasAdminPermission: vi.fn().mockReturnValue(true),
    };
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FeaturePermissionBannerComponent, NoopAnimationsModule],
      providers: [
        { provide: FeaturePermissionService, useValue: mockPermissionService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();
  });

  it("should create", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("should show the configure button for an admin", () => {
    mockPermissionService.hasAdminPermission.mockReturnValue(true);
    createComponent();

    expect(component.canManage()).toBe(true);
    expect(fixture.nativeElement.querySelector("button")).toBeTruthy();
  });

  it("should not show the banner for a non-admin", () => {
    mockPermissionService.hasAdminPermission.mockReturnValue(false);
    createComponent();

    expect(component.canManage()).toBe(false);
    expect(fixture.nativeElement.querySelector("button")).toBeNull();
  });

  it("should open the permission dialog scoped to the entity type", () => {
    createComponent();

    component.openDialog();

    expect(mockDialog.open).toHaveBeenCalledWith(
      FeaturePermissionDialogComponent,
      expect.objectContaining({
        data: {
          entityType: TestEntity.ENTITY_TYPE,
          entityLabel: TestEntity.labelPlural,
        },
      }),
    );
  });
});
