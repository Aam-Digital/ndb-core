import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import {
  applyTextToCreatedEntity,
  EntitySelectComponent,
} from "./entity-select.component";
import { Entity } from "../../entity/model/entity";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../session/session-states/login-state.enum";
import { Logging } from "../../logging/logging.service";
import { FormControl } from "@angular/forms";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../entity/database-entity.decorator";

fdescribe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any>;
  let fixture: ComponentFixture<EntitySelectComponent<any>>;
  let test1Entities: TestEntity[];
  let test2Entities: Test2Entity[];
  let formControl: FormControl;

  @DatabaseEntity("Test2Entity")
  class Test2Entity extends TestEntity {}

  beforeEach(waitForAsync(() => {
    formControl = new FormControl();

    test1Entities = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
      return new TestEntity(s);
    });
    test2Entities = [new Test2Entity(), new Test2Entity()];
    const otherEntities: Entity[] = [createEntityOfType("OtherEntityType")];

    TestBed.configureTestingModule({
      imports: [
        EntitySelectComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...test1Entities,
          ...test2Entities,
          ...otherEntities,
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySelectComponent);
    fixture.componentRef.setInput("form", formControl);
    fixture.detectChanges();

    component = fixture.componentInstance;
  });

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    expect(component.loading.value).toBe(true);
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    tick();
    expect(component.availableOptions()).toEqual(
      jasmine.arrayWithExactContents(test1Entities),
    );
  }));

  it("suggests all entities of multiple different types if configured", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", [
      TestEntity.ENTITY_TYPE,
      Test2Entity.ENTITY_TYPE,
    ]);
    fixture.detectChanges();
    tick();

    expect(component.availableOptions()).toEqual(
      [...test1Entities, ...test2Entities].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  }));

  it("should retain missing entity and show warning", fakeAsync(() => {
    const warnSpy = spyOn(Logging, "warn");
    component.label = "test label";
    component.form().setValue([test1Entities[0].getId(), "missing_user"]);
    tick();
    fixture.detectChanges();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("ENTITY_SELECT"),
      "test label",
      "missing_user",
      jasmine.anything(),
    );
    expect(component.form().value).toEqual([
      test1Entities[0].getId(),
      "missing_user",
    ]);
    expect(component.hasInaccessibleEntities).toBeTrue();
  }));

  it("shows inactive entities according to the includeInactive state", fakeAsync(() => {
    test1Entities[0].isActive = false;
    test1Entities[2].isActive = false;
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    tick();

    expect(component.availableOptions().length).toEqual(
      test1Entities.length - 2,
    );
    component.toggleIncludeInactive();
    fixture.detectChanges();
    tick();
    expect(component.availableOptions().length).toEqual(test1Entities.length);

    test1Entities[2].isActive = true;
    component.toggleIncludeInactive();
    fixture.detectChanges();
    tick();
    expect(component.availableOptions().length).toEqual(3);
  }));

  it("should smartly distribute the input text to all toStringAttributes when create a new record", async () => {
    class TestEntity extends Entity {
      static override toStringAttributes = ["firstName", "lastName"];
    }

    expect(applyTextToCreatedEntity(new TestEntity(), "one")).toEqual(
      jasmine.objectContaining({ firstName: "one" }),
    );
    expect(applyTextToCreatedEntity(new TestEntity(), "one two")).toEqual(
      jasmine.objectContaining({ firstName: "one", lastName: "two" }),
    );
    expect(applyTextToCreatedEntity(new TestEntity(), "one    two")).toEqual(
      jasmine.objectContaining({ firstName: "one", lastName: "two" }),
    );
    // if more input parts than toStringAttributes, put all remaining parts into last property:
    expect(applyTextToCreatedEntity(new TestEntity(), "one two three")).toEqual(
      jasmine.objectContaining({ firstName: "one", lastName: "two three" }),
    );
  });
});
