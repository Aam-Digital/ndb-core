import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityUserComponent } from "./entity-user.component";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, of } from "rxjs";
import { SessionSubject } from "../../session/auth/session-info";
import { Entity } from "../../entity/model/entity";
import { Role, UserAccount } from "../user-admin-service/user-account";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { SyncStateSubject } from "../../session/session-type";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityAbility } from "../../permissions/ability/entity-ability";

describe("EntityUserComponent", () => {
  let component: EntityUserComponent;
  let fixture: ComponentFixture<EntityUserComponent>;

  let mockUserAdminService: jasmine.SpyObj<UserAdminService>;
  let mockHttp: jasmine.SpyObj<HttpClient>;

  const USER_ID = "test-id";
  const assignedRole: Role = {
    id: "assigned-role",
    name: "Assigned Role",
    description: "this role is assigned to the user",
  };
  const user = Object.assign(new Entity(), { username: "test-user" });
  let keycloakUser: UserAccount;

  beforeEach(async () => {
    keycloakUser = {
      id: USER_ID,
      email: "my@email.de",
      roles: [assignedRole],
      enabled: true,
    };

    mockUserAdminService = jasmine.createSpyObj([
      "getUser",
      "getAllRoles",
      "updateUser",
      "createUser",
      "deleteUser",
    ]);
    mockUserAdminService.getUser.and.returnValue(of(keycloakUser));
    mockUserAdminService.updateUser.and.returnValue(of({ userUpdated: true }));
    mockUserAdminService.deleteUser.and.returnValue(of({ userDeleted: true }));
    mockUserAdminService.createUser.and.returnValue(of(keycloakUser));
    mockUserAdminService.getAllRoles.and.returnValue(of([assignedRole]));

    mockHttp = jasmine.createSpyObj(["post"]);
    mockHttp.post.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [EntityUserComponent],
      providers: [
        { provide: UserAdminService, useValue: mockUserAdminService },
        { provide: HttpClient, useValue: mockHttp },
        {
          provide: SessionSubject,
          useValue: new BehaviorSubject({
            name: user.getId(true),
            roles: [UserAdminService.ACCOUNT_MANAGER_ROLE],
          }),
        },
        SyncStateSubject,
        CurrentUserSubject,
        EntityRegistry,
        EntityAbility,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityUserComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entity", user);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load existing account data", () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.user()).toBe(keycloakUser);
  });

  it("should check user permissions", () => {
    expect(component.userIsPermitted()).toBe(true);
  });
});
