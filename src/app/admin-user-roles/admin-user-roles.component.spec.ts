import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminUserRolesComponent } from "./admin-user-roles.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

describe("AdminUserRolesComponent", () => {
  let component: AdminUserRolesComponent;
  let fixture: ComponentFixture<AdminUserRolesComponent>;
  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let router: Router;

  const mockUsers: UserAccount[] = [
    {
      id: "user1",
      userEntityId: "User:user1",
      email: "user1@example.com",
      enabled: true,
      emailVerified: true,
      roles: [{ id: "role1", name: "user_app" }],
    },
    {
      id: "user2",
      userEntityId: "User:user2",
      email: "user2@example.com",
      enabled: false,
      emailVerified: false,
      roles: [{ id: "role2", name: "admin_app" }],
    },
  ];

  beforeEach(async () => {
    mockUserAdminService = jasmine.createSpyObj("UserAdminService", [
      "getAllUsers",
    ]);
    mockUserAdminService.getAllUsers.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      imports: [
        AdminUserRolesComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserRolesComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should format role names correctly", () => {
    const roleNames = component.getRoleNames(mockUsers[0]);
    expect(roleNames).toBe("user_app");
  });

  it("should handle users with multiple roles", () => {
    const userWithMultipleRoles: UserAccount = {
      ...mockUsers[0],
      roles: [
        { id: "role1", name: "user_app" },
        { id: "role2", name: "admin_app" },
      ],
    };
    const roleNames = component.getRoleNames(userWithMultipleRoles);
    expect(roleNames).toBe("user_app, admin_app");
  });

  it("should handle users with no roles", () => {
    const userWithoutRoles: UserAccount = {
      ...mockUsers[0],
      roles: undefined,
    };
    const roleNames = component.getRoleNames(userWithoutRoles);
    expect(roleNames).toBe("-");
  });
});
