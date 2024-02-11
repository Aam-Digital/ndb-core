import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { EntitySelectComponent } from "./entity-select.component";
import { Entity } from "../../entity/model/entity";
import { User } from "../../user/user";
import { Child } from "../../../child-dev-project/children/model/child";
import { School } from "../../../child-dev-project/schools/model/school";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../session/session-states/login-state.enum";
import { LoggingService } from "../../logging/logging.service";
import { FormControl } from "@angular/forms";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any, any>;
  let fixture: ComponentFixture<EntitySelectComponent<any, any>>;
  let testUsers: Entity[];
  let testChildren: Entity[];
  let formControl: FormControl;

  beforeEach(waitForAsync(() => {
    formControl = new FormControl();

    testUsers = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
      const user = new User();
      user.name = s;
      return user;
    });
    testChildren = [new Child(), new Child()];
    const otherEntities: Entity[] = [new School()];

    TestBed.configureTestingModule({
      imports: [
        EntitySelectComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...testUsers,
          ...testChildren,
          ...otherEntities,
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySelectComponent);
    component = fixture.componentInstance;
    component.form = formControl;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("eventually loads all entities of the given type when the entity-type is set", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    fixture.detectChanges();
    tick();
    expect(component.allEntities.length).toBe(testUsers.length);
  }));

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    expect(component.loading.value).toBe(true);
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    tick();
    fixture.detectChanges();
    expect(component.availableOptions.value).toEqual(
      jasmine.arrayWithExactContents(testUsers),
    );
  }));

  it("suggests all entities of multiple different types if configured", fakeAsync(() => {
    component.entityType = [User.ENTITY_TYPE, Child.ENTITY_TYPE];
    tick();
    fixture.detectChanges();

    expect(component.allEntities).toEqual(
      [...testUsers, ...testChildren].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
    expect(component.availableOptions.value).toEqual(
      [...testUsers, ...testChildren].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  }));

  it("should not fail if selected entity (value) is not found", fakeAsync(() => {
    const warnSpy = spyOn(TestBed.inject(LoggingService), "warn");
    component.entityType = User.ENTITY_TYPE;
    component.form.setValue([testUsers[0].getId(), "missing_user"]);
    tick();
    fixture.detectChanges();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("missing_user"),
    );
    expect(component.form.value).toEqual([testUsers[0].getId()]);
  }));

  it("shows inactive entities according to the includeInactive state", fakeAsync(() => {
    testUsers[0].isActive = false;
    testUsers[2].isActive = false;
    component.entityType = User.ENTITY_TYPE;
    tick();

    expect(component.availableOptions.value.length).toEqual(
      testUsers.length - 2,
    );

    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions.value.length).toEqual(testUsers.length);

    testUsers[2].isActive = true;
    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions.value.length).toEqual(3);
  }));

  it("should update matchingInactive count when autocomplete filter changes", fakeAsync(() => {
    const testEntities = [
      Child.create("AB"),
      Child.create("AC"),
      Child.create("X"),
    ];
    testEntities.forEach((e) => (e.inactive = true));
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo(
      testEntities,
    );

    component.entityType = Child.ENTITY_TYPE;
    tick();
    expect(component.currentlyMatchingInactive).toBe(testEntities.length);

    component.recalculateMatchingInactive((o) => o["name"].startsWith("A"));
    expect(component.currentlyMatchingInactive).toBe(2);
  }));

  it("should show selected entities of type that is not configured", fakeAsync(() => {
    component.entityType = [User.ENTITY_TYPE];
    component.form.setValue([testUsers[0].getId(), testChildren[0].getId()]);
    tick();
    fixture.detectChanges();

    expect(component.form.value).toEqual(
      jasmine.arrayWithExactContents([
        testUsers[0].getId(),
        testChildren[0].getId(),
      ]),
    );
    expect(component.allEntities).toEqual(
      jasmine.arrayWithExactContents(testUsers),
    );
    expect(component.availableOptions.value).toEqual(
      jasmine.arrayWithExactContents([...testUsers, testChildren[0]]),
    );
  }));
});
