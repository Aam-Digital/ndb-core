import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminUserListComponent } from "./admin-user-list.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { UserSecurityComponent } from "../core/user/user-security/user-security.component";

describe("AdminUserListComponent", () => {
  let component: AdminUserListComponent;
  let fixture: ComponentFixture<AdminUserListComponent>;
  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<UserSecurityComponent>>;

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
    {
      id: "user3",
      userEntityId: undefined, // User without entity ID
      email: "user3@example.com",
      enabled: true,
      emailVerified: true,
      roles: [{ id: "role1", name: "user_app" }],
    },
  ];

  const updatedMockUsers: UserAccount[] = [
    {
      id: "user1",
      userEntityId: "User:user1",
      email: "updated@example.com", // Updated email
      enabled: true,
      emailVerified: true,
      roles: [
        { id: "role1", name: "user_app" },
        { id: "role3", name: "account_manager" }, // Added role
      ],
    },
    {
      id: "user2",
      userEntityId: "User:user2",
      email: "user2@example.com",
      enabled: false,
      emailVerified: false,
      roles: [{ id: "role2", name: "admin_app" }],
    },
    {
      id: "user3",
      userEntityId: undefined,
      email: "user3@example.com",
      enabled: true,
      emailVerified: true,
      roles: [{ id: "role1", name: "user_app" }],
    },
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["afterClosed"]);
    mockDialogRef.afterClosed.and.returnValue(of(true));

    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialog.open.and.returnValue(mockDialogRef);

    mockUserAdminService = jasmine.createSpyObj("UserAdminService", [
      "getAllUsers",
    ]);
    mockUserAdminService.getAllUsers.and.returnValue(of(mockUsers));

    await TestBed.configureTestingModule({
      imports: [
        AdminUserListComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUserListComponent);
    component = fixture.componentInstance;
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

  it("should not open dialog when clicking row without userEntityId", () => {
    component.openUserSecurity(mockUsers[2]);

    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it("should reload users after dialog is closed with result", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(of(true));

    const user = mockUsers[0];
    component.openUserSecurity(user);

    expect(mockUserAdminService.getAllUsers).toHaveBeenCalledTimes(1);
    expect(component.users()).toEqual(updatedMockUsers);
  });

  it("should not reload users if dialog is closed without result", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockDialogRef.afterClosed.and.returnValue(of(null));

    const user = mockUsers[0];
    component.openUserSecurity(user);

    expect(mockUserAdminService.getAllUsers).not.toHaveBeenCalled();
  });

  it("should reflect updated roles in the table after dialog closes", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(of(true));

    const user = mockUsers[0];
    component.openUserSecurity(user);

    const updatedUser = component.users()[0];
    expect(updatedUser.email).toBe("updated@example.com");
    expect(component.getRoleNames(updatedUser)).toBe(
      "user_app, account_manager",
    );
  });

  it("should reflect updated email in the table after dialog closes", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(of(true));

    const user = mockUsers[0];
    const originalEmail = user.email;
    component.openUserSecurity(user);

    const updatedUser = component.users()[0];
    expect(updatedUser.email).not.toBe(originalEmail);
    expect(updatedUser.email).toBe("updated@example.com");
  });
});
