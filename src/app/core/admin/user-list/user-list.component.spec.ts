import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { UserListComponent } from "./user-list.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { AdminModule } from "../admin.module";
import { User } from "../../user/user";
import { SessionService } from "../../session/session-service/session.service";

describe("UserListComponent", () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let testUsers: User[];

  beforeEach(
    waitForAsync(() => {
      testUsers = [new User("1"), new User("2")];
      mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", [
        "loadType",
        "save",
      ]);
      mockEntityMapper.loadType.and.returnValue(Promise.resolve(testUsers));

      mockSessionService = jasmine.createSpyObj([
        "getCurrentDBUser",
        "getCurrentUser",
      ]);
      mockSessionService.getCurrentDBUser.and.returnValue({
        name: "TestUser",
        roles: [],
      });

      TestBed.configureTestingModule({
        imports: [AdminModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: SessionService, useValue: mockSessionService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should makeAdmin and save if user has admin rights", async () => {
    const currentUser = new User("tester");
    currentUser.setAdmin(true);
    mockSessionService.getCurrentUser.and.returnValue(currentUser);

    await component.makeAdmin(testUsers[0], true);
    expect(testUsers[0].isAdmin()).toBeTruthy();
    expect(mockEntityMapper.save).toHaveBeenCalledWith(testUsers[0]);
  });

  it("should not makeAdmin if user has no admin rights", async () => {
    const currentUser = new User("tester");
    currentUser.setAdmin(false);
    mockSessionService.getCurrentUser.and.returnValue(currentUser);

    await component.makeAdmin(testUsers[0], true);
    expect(testUsers[0].isAdmin()).toBeFalsy();
    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should not let you remove your own admin rights", async () => {
    const currentUser = new User("1");
    currentUser.setAdmin(true);
    mockSessionService.getCurrentUser.and.returnValue(currentUser);
    mockSessionService.getCurrentDBUser.and.returnValue({
      name: currentUser.getId(),
      roles: [],
    });

    await component.makeAdmin(currentUser, false);

    expect(currentUser.isAdmin()).toBeTruthy();
    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });
});
