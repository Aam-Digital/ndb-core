import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSelectComponent } from "./user-select.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { User } from "../user";
import { LoggingService } from "../../logging/logging.service";

const mockedAlertService = {
  addWarning(message?: string, info?: { specName?: string }) {
    // Do nothing
  },
};

const mockedLoggingService = {
  warn(message: any) {
    // Do nothing
  },
};

describe("UserSelectComponent", () => {
  let component: UserSelectComponent;
  let fixture: ComponentFixture<UserSelectComponent>;

  let id = 0;
  function _User(name: string): User {
    const user = new User(String(id));
    user.name = name;
    id += 1;
    return user;
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserSelectComponent, MatAutocomplete],
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        { provide: LoggingService, useValue: mockedLoggingService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reflect changes", (done) => {
    component.selectedUsersChange.subscribe((newValue: string) => {
      expect(newValue).toEqual("A");
      done();
    });
    component.allUsers = [];
    component.selectedUsers = [_User("A")];
    component.onInputChanged();
  });

  it("should select a user and emit the change", (done) => {
    component.selectedUsersChange.subscribe((newValue: string) => {
      expect(newValue).toEqual("A");
      done();
    });
    component.selectUser(_User("A"));
  });

  it("should autocomplete existing users", () => {
    component.allUsers = [_User("AA"), _User("AB"), _User("Z")];
    component.selectedUsers = [_User("a")];
    component.onInputChanged();
    let userSuggestionIds = component.suggestedUsers.map((user) => user.name);
    expect(userSuggestionIds).toEqual(["AA", "AB"]);
    component.selectedUsers = [_User("ab")];
    component.onInputChanged();
    userSuggestionIds = component.suggestedUsers.map((user) => user.name);
    expect(userSuggestionIds).toEqual(["AB"]);
  });
});
