import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { UserSelectComponent } from "./user-select.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";
import { MockDatabase } from "../../database/mock-database";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { MatAutocomplete } from "@angular/material/autocomplete";
import { User } from "../user";

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
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSelectComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reflect changes", (done) => {
    component.userChange.subscribe((newValue: string) => {
      expect(newValue).toEqual("A");
      done();
    });
    component.users = [];
    component.user = "A";
    component.onInputChanged();
  });

  it("should select a user and emit the change", (done) => {
    component.userChange.subscribe((newValue: string) => {
      expect(newValue).toEqual("A");
      done();
    });
    component.selectUser(_User("A"));
  });

  it("should autocomplete existing users", () => {
    component.users = [_User("AA"), _User("AB"), _User("Z")];
    component.user = "a";
    component.onInputChanged();
    let userSuggestionIds = component.suggestions.map((user) => user.name);
    expect(userSuggestionIds).toEqual(["AA", "AB"]);
    component.user = "ab";
    component.onInputChanged();
    userSuggestionIds = component.suggestions.map((user) => user.name);
    expect(userSuggestionIds).toEqual(["AB"]);
  });
});
