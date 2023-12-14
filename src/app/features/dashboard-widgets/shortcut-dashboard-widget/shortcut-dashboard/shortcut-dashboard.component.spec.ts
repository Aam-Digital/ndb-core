import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ShortcutDashboardComponent } from "./shortcut-dashboard.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { UserRoleGuard } from "../../../../core/permissions/permission-guard/user-role.guard";
import { EntityPermissionGuard } from "../../../../core/permissions/permission-guard/entity-permission.guard";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";

describe("ShortcutDashboardComponent", () => {
  let component: ShortcutDashboardComponent;
  let fixture: ComponentFixture<ShortcutDashboardComponent>;
  let mockRoleGuard: jasmine.SpyObj<UserRoleGuard>;
  let mockPermissionGuard: jasmine.SpyObj<EntityPermissionGuard>;

  beforeEach(async () => {
    mockRoleGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    mockPermissionGuard = jasmine.createSpyObj(["checkRoutePermissions"]);
    await TestBed.configureTestingModule({
      imports: [ShortcutDashboardComponent, FontAwesomeTestingModule],
      providers: [
        { provide: EntityMapperService, useValue: undefined },
        { provide: UserRoleGuard, useValue: mockRoleGuard },
        { provide: EntityPermissionGuard, useValue: mockPermissionGuard },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortcutDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should only show routes to which the user has access", fakeAsync(() => {
    mockRoleGuard.checkRoutePermissions.and.callFake((route) => {
      switch (route) {
        case "/child":
          return true;
        case "/school":
          return false;
      }
    });
    mockPermissionGuard.checkRoutePermissions.and.resolveTo(true);
    const childItem = new MenuItem("Children", "child", "/child");
    const schoolItem = new MenuItem("School", "building", "/school");

    component.shortcuts = [childItem, schoolItem];
    tick();

    expect(component.shortcuts).toEqual([childItem]);
  }));
});
