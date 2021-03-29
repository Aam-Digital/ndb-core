import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { UserListComponent } from "./user-list.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { User } from "../user";

describe("UserListComponent", () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  const testUsers: User[] = ["UserA", "demo", "demoAdmin", "UserB"].map(
    (name) => {
      const user = new User();
      user.name = name;
      return user;
    }
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        {
          provide: Database,
          useValue: MockDatabase.createWithData(testUsers),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load all users when given as id's", fakeAsync(() => {
    component.inputType = "id";
    component.entities = testUsers.slice(2, 3).map((u) => u.getId());
    tick();
    expect(component._users).toEqual(testUsers.slice(2, 3));
  }));

  it("should load all users when given as entitis", fakeAsync(() => {
    component.inputType = "entity";
    component.entities = [...testUsers.slice(2, 3)];
    tick();
    expect(component._users).toEqual(testUsers.slice(2, 3));
  }));

  it("shows all users when less than the threshold is shown", () => {
    [1, 2].forEach((userCount) => {
      component.inputType = "entity";
      component.maxUserThreshold = 2;
      component.entities = [...testUsers.slice(0, userCount)];
      const expectedString = testUsers
        .slice(0, userCount)
        .map((u) => u.name)
        .join(", ");
      expect(component.authorNames).toEqual(expectedString);
    });
  });

  it("shows the a sliced list of all users when more than the threshold is shown", () => {
    [3, 4].forEach((userCount) => {
      component.inputType = "entity";
      const threshold = 2;
      component.maxUserThreshold = threshold;
      component.entities = [...testUsers.slice(0, userCount)];
      let expectedString = testUsers
        .slice(0, threshold)
        .map((u) => u.name)
        .join(", ");
      expectedString =
        expectedString + " and " + String(userCount - threshold) + " more";
      expect(component.authorNames).toEqual(expectedString);
    });
  });
});
