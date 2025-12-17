import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { UserListComponent } from "./user-list.component";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { UserDetailsComponent } from "../user-details/user-details.component";
import { BehaviorSubject, of } from "rxjs";
import { UserAccount } from "../user-admin-service/user-account";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SessionSubject } from "../../session/auth/session-info";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityRegistry } from "../../entity/database-entity.decorator";

describe("UserListComponent", () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<UserDetailsComponent>>;
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
        FontAwesomeTestingModule,
        NoopAnimationsModule,
        UserListComponent,
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

    fixture = TestBed.createComponent(UserListComponent);
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

  it("should reload users after dialog is closed with 'created' result", () => {
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(
      of({
        type: "accountCreated",
        data: {
          userEntityId: "xyz",
          enabled: true,
        } as UserAccount,
      }),
    );

    const user = mockUsers[0];
    component.openUserDetails(user);

    expect(mockUserAdminService.getAllUsers).toHaveBeenCalledTimes(1);
    expect(component.users()).toEqual(updatedMockUsers);
  });

  it("should reflect updated roles in the table after dialog closes", () => {
    component.users.set(mockUsers);
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(
      of({
        type: "accountUpdated",
        data: { user: updatedMockUsers[0] },
      }),
    );

    const user = mockUsers[0];
    component.openUserDetails(user);

    const updatedUser = component.users()[0];
    expect(updatedUser.email).toBe("updated@example.com");
    expect(component.getRoleNames(updatedUser)).toBe(
      "user_app, account_manager",
    );
  });

  it("should reflect updated email in the table after dialog closes", fakeAsync(() => {
    component.users.set(mockUsers);
    mockUserAdminService.getAllUsers.calls.reset();
    mockUserAdminService.getAllUsers.and.returnValue(of(updatedMockUsers));
    mockDialogRef.afterClosed.and.returnValue(
      of({
        type: "accountUpdated",
        data: { user: updatedMockUsers[0] },
      }),
    );

    const user = mockUsers[0];
    const originalEmail = user.email;
    component.openUserDetails(user);
    tick();

    const updatedUser = component.users()[0];
    expect(updatedUser.email).not.toBe(originalEmail);
    expect(updatedUser.email).toBe("updated@example.com");
  }));
});
