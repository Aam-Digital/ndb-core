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
import { MatAutocompleteHarness } from "@angular/material/autocomplete/testing";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;
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
    expect(component.filteredEntities.length).toBe(testUsers.length);
  }));

  it("contains the initial selection as entities", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    const expectation = testUsers.slice(2, 3).map((user) => user.getId());

    component.selection = expectation;
    fixture.detectChanges();
    tick();

    component.selectedEntities.forEach((s) => expect(s).toBeInstanceOf(User));
    expect(component.selectedEntities.map((s) => s.getId())).toEqual(
      expectation,
    );
  }));

  it("accepts initial selection as IDs with and without prefix", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;

    component.selection = [testUsers[1].getId()];
    fixture.detectChanges();
    tick();
    expect(component.selectedEntities).toEqual([testUsers[1]]);

    component.selection = [testUsers[2].getId(true)];
    fixture.detectChanges();
    tick();
    expect(component.selectedEntities).toEqual([testUsers[2]]);
  }));

  it("emits whenever a new entity is selected", fakeAsync(() => {
    spyOn(component.selectionChange, "emit");
    component.entityType = User.ENTITY_TYPE;
    tick();

    component.selectEntity(testUsers[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(),
    ]);

    component.selectEntity(testUsers[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(),
      testUsers[1].getId(),
    ]);
    tick();
  }));

  it("emits with prefix the new entity selected", fakeAsync(() => {
    component.withPrefix = true;
    spyOn(component.selectionChange, "emit");
    component.entityType = User.ENTITY_TYPE;
    tick();

    component.selectEntity(testUsers[0]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(true),
    ]);

    component.selectEntity(testUsers[1]);
    expect(component.selectionChange.emit).toHaveBeenCalledWith([
      testUsers[0].getId(true),
      testUsers[1].getId(true),
    ]);
    tick();
  }));

  it("emits whenever a selected entity is removed", () => {
    spyOn(component.selectionChange, "emit");
    component.selectedEntities = [...testUsers];

    component.unselectEntity(testUsers[0]);

    const remainingChildren = testUsers
      .filter((c) => c.getId() !== testUsers[0].getId())
      .map((c) => c.getId());
    expect(component.selectionChange.emit).toHaveBeenCalledWith(
      remainingChildren,
    );
  });

  it("adds a new entity if it matches a known entity", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    component.allEntities = testUsers;
    tick();

    component.select({ value: testUsers[0]["name"] });
    expect(component.selectedEntities).toEqual([testUsers[0]]);
    tick();
  }));

  it("does not add anything if a new entity doesn't match", fakeAsync(() => {
    component.allEntities = testUsers;
    component.select({ value: "ZZ" });
    expect(component.selectedEntities).toBeEmpty();
    tick();
  }));

  it("autocompletes with the default accessor", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    tick();
    component.allEntities = testUsers;
    component.loading.next(false);

    component.formControl.setValue(null);
    tick();
    expect(component.filteredEntities.length).toEqual(4);

    component.formControl.setValue("A");
    tick();
    expect(component.filteredEntities.length).toEqual(3);

    component.formControl.setValue("c");
    tick();
    expect(component.filteredEntities.length).toEqual(2);

    component.formControl.setValue("Abc");
    tick();
    expect(component.filteredEntities.length).toEqual(1);

    component.formControl.setValue("z");
    tick();
    expect(component.filteredEntities.length).toEqual(0);
    tick();
  }));

  it("shows inactive entites according to the includeInactive state", fakeAsync(() => {
    testUsers[0].isActive = false;
    testUsers[2].isActive = false;
    component.entityType = User.ENTITY_TYPE;
    tick();
    component.allEntities = testUsers;
    component.loading.next(false);

    component.formControl.setValue(null);
    expect(component.filteredEntities.length).toEqual(2);

    component.toggleIncludeInactive();
    expect(component.filteredEntities.length).toEqual(4);

    testUsers[2].isActive = true;
    component.toggleIncludeInactive();
    expect(component.filteredEntities.length).toEqual(3);
  }));

  it("shows the autocomplete options and eventually the hidden autocomplete option in case of corresponding inactive entities appropriately", fakeAsync(async () => {
    const testEntities = [
      "Aaa",
      "Aab",
      "Aac",
      "Baa",
      "Bab",
      "Bac",
      "Caa",
      "Cab",
    ].map((s) => {
      const user = new User();
      user.name = s;
      return user;
    });
    testEntities[6].isActive = false;
    testEntities[7].isActive = false;

    const mockEntityMapper = TestBed.inject(EntityMapperService);
    spyOn(mockEntityMapper, "loadType").and.resolveTo(testEntities);
    component.entityType = User.ENTITY_TYPE;
    tick();
    component.allEntities = testEntities;

    component.loading.next(false);
    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    let options;

    console.log(
      "shows the autocomplete ... allEntities:",
      component.allEntities,
    );
    console.log(
      "shows the autocomplete ... RelevantEntities:",
      component.entitiesPassingAdditionalFilter,
    );

    autocomplete.enterText("X");
    options = await autocomplete.getOptions();
    expect(options.length).toEqual(0);

    autocomplete.clear();
    autocomplete.enterText("Ba");
    options = await autocomplete.getOptions();
    expect(options.length).toEqual(3);

    autocomplete.clear();
    autocomplete.enterText("Ca");
    options = await autocomplete.getOptions();
    expect(options.length).toEqual(1);

    tick();
  }));

  it("should use the configurable toStringAttributes for comparing values", fakeAsync(() => {
    class Person extends Entity {
      static toStringAttributes = ["firstname", "lastname"];
      firstname: string;
      lastname: string;
    }

    const p1 = Object.assign(new Person(), { firstname: "Aa", lastname: "bb" });
    const p2 = Object.assign(new Person(), { firstname: "Aa", lastname: "cc" });
    const mockEntityMapper = TestBed.inject(EntityMapperService);
    spyOn(mockEntityMapper, "loadType").and.resolveTo([p1, p2]);
    component.entityType = Person.ENTITY_TYPE;
    tick();
    component.allEntities = [p1, p2];
    component.loading.next(false);

    component.formControl.setValue("Aa");
    tick();
    expect(component.filteredEntities).toEqual([p1, p2]);

    component.formControl.setValue("Aa b");
    tick();
    expect(component.filteredEntities).toEqual([p1]);
  }));

  it("should add an unselected entity to the filtered entities array", fakeAsync(() => {
    component.entityType = User.ENTITY_TYPE;
    component.allEntities = testUsers;
    tick();

    const selectedUser = testUsers[1];
    component.selectEntity(selectedUser);
    expect(component.filteredEntities).not.toContain(selectedUser);

    component.unselectEntity(selectedUser);
    expect(component.filteredEntities).toContain(selectedUser);
    tick();
  }));

  it("suggests all entities of multiple different types if configured", fakeAsync(() => {
    component.entityType = [User.ENTITY_TYPE, Child.ENTITY_TYPE];
    tick();
    fixture.detectChanges();
    console.log(
      "suggests all entities ... allEntities:",
      component.allEntities,
    );
    console.log(
      "suggests all entities ... relevantEntities:",
      component.entitiesPassingAdditionalFilter,
    );
    expect(component.allEntities).toEqual(
      [...testUsers, ...testChildren].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
    expect(component.filteredEntities).toEqual(
      [...testUsers, ...testChildren].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  }));

  it("should be able to select entities from different types", fakeAsync(() => {
    component.entityType = [User.ENTITY_TYPE, Child.ENTITY_TYPE];
    component.selection = [
      testUsers[1].getId(true),
      testChildren[0].getId(true),
    ];
    fixture.detectChanges();
    tick();

    expect(component.selectedEntities).toEqual([testUsers[1], testChildren[0]]);
  }));

  it("activates withPrefix automatically when multiple different types are configured", fakeAsync(() => {
    component.withPrefix = false;
    component.entityType = [User.ENTITY_TYPE, Child.ENTITY_TYPE];
    tick();
    fixture.detectChanges();
    expect(component.withPrefix).toBeTrue();
  }));
});
