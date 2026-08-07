import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject } from "rxjs";
import { FeaturePermissionBannerComponent } from "./feature-permission-banner.component";
import { PermissionsConfigService } from "../../permissions-config.service";
import { FeaturePermissionDialogComponent } from "../feature-permission-dialog/feature-permission-dialog.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("FeaturePermissionBannerComponent", () => {
  let fixture: ComponentFixture<FeaturePermissionBannerComponent>;
  let component: FeaturePermissionBannerComponent;
  let canManagePermissions$: BehaviorSubject<boolean>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  function createComponent() {
    fixture = TestBed.createComponent(FeaturePermissionBannerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    canManagePermissions$ = new BehaviorSubject(true);
    mockDialog = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FeaturePermissionBannerComponent, NoopAnimationsModule],
      providers: [
        {
          provide: PermissionsConfigService,
          useValue: { canManagePermissions$ },
        },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();
  });

  it("should create", () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it("should show the configure button only while the user may edit permissions", () => {
    createComponent();
    expect(component.canManage()).toBe(true);
    expect(fixture.nativeElement.querySelector("button")).toBeTruthy();

    // rules can change while the view is open, e.g. after a role change
    canManagePermissions$.next(false);
    fixture.detectChanges();

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
