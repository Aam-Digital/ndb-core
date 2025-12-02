import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminUserListComponent } from "./admin-user-list.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { BehaviorSubject, of } from "rxjs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EntityUserComponent } from "../core/user/entity-user/entity-user.component";
import { SessionSubject } from "../core/session/auth/session-info";
import { SyncStateSubject } from "../core/session/session-type";
import { CurrentUserSubject } from "../core/session/current-user-subject";
import { EntityRegistry } from "../core/entity/database-entity.decorator";
describe("AdminUserListComponent", () => {
  let component: AdminUserListComponent;
  let fixture: ComponentFixture<AdminUserListComponent>;
  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EntityUserComponent>>;
  let mockSessionSubject: BehaviorSubject<any>;

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
      userEntityId: undefined,
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
      email: "updated@example.com",
      enabled: true,
      emailVerified: true,
      roles: [
        { id: "role1", name: "user_app" },
        { id: "role3", name: "account_manager" },
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
    const mockComponentInstance = {
      action: {
        subscribe: jasmine.createSpy("subscribe"),
      },
    };

    mockDialogRef = jasmine.createSpyObj("MatDialogRef", [
      "afterClosed",
      "close",
    ]);
    mockDialogRef.afterClosed.and.returnValue(of(true));
    mockDialogRef.componentInstance = mockComponentInstance as any;

    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialog.open.and.returnValue(mockDialogRef);

    mockUserAdminService = jasmine.createSpyObj("UserAdminService", [
      "getAllUsers",
    ]);
    mockUserAdminService.getAllUsers.and.returnValue(of(mockUsers));

    mockSessionSubject = new BehaviorSubject({
      name: "test-user",
      email: "test@example.com",
      roles: ["user_app"],
    });

    await TestBed.configureTestingModule({
      imports: [
        AdminUserListComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SessionSubject, useValue: mockSessionSubject },
        SyncStateSubject,
        CurrentUserSubject,
        EntityRegistry,
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

  it("should reload users after dialog is closed with result", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(of(true));

    const user = mockUsers[0];
    component.openUserSecurity(user);

    expect(mockUserAdminService.getAllUsers).toHaveBeenCalledTimes(1);
    expect(component.users()).toEqual(updatedMockUsers);
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
