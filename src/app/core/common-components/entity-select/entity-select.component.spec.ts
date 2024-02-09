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
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { LoggingService } from "../../logging/logging.service";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any, any>;
  let fixture: ComponentFixture<EntitySelectComponent<any, any>>;
  let loader: HarnessLoader;
  let testUsers: Entity[];
  let testChildren: Entity[];

  beforeEach(waitForAsync(() => {
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
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
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
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    tick();
    fixture.detectChanges();
    expect(component.availableOptions.value.length).toBe(testUsers.length);
  }));

  it("discards IDs from initial selection that don't correspond to an existing entity", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;

    component.selection = [
      new Child("not-existing").getId(),
      testUsers[1].getId(),
    ];
    fixture.detectChanges();
    tick();

    expect(component.selectedEntities).toEqual([testUsers[1]]);
  }));

  it("shows inactive entites according to the includeInactive state", fakeAsync(() => {
    testUsers[0].isActive = false;
    testUsers[2].isActive = false;
    component.entityType = User.ENTITY_TYPE;
    tick();
    component.allEntities = testUsers;
    component.loading.next(false);

    expect(component.availableOptions.value.length).toEqual(2);

    component.toggleIncludeInactive();
    expect(component.availableOptions.value.length).toEqual(4);

    testUsers[2].isActive = true;
    component.toggleIncludeInactive();
    expect(component.availableOptions.value.length).toEqual(3);
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

  it("should show selected entities of type that is not configured", fakeAsync(() => {
    component.entityType = [User.ENTITY_TYPE];
    component.selection = [testUsers[0].getId(), testChildren[0].getId()];
    tick();
    fixture.detectChanges();
    expect(component.selectedEntities).toEqual(
      jasmine.arrayWithExactContents([testUsers[0], testChildren[0]]),
    );
    expect(component.allEntities).toEqual(
      jasmine.arrayWithExactContents(testUsers),
    );
    expect(component.filteredEntities).toEqual(
      jasmine.arrayWithExactContents(testUsers.slice(1)),
    );
  }));

  it("should not fail if entity cannot be found", fakeAsync(() => {
    const warnSpy = spyOn(TestBed.inject(LoggingService), "warn");
    component.entityType = User.ENTITY_TYPE;
    component.selection = [testUsers[0].getId(), "missing_user"];
    tick();
    fixture.detectChanges();
    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("missing_user"),
    );
    expect(component.selectedEntities).toEqual([testUsers[0]]);
  }));
});
