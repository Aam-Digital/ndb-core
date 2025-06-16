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
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "../../form-dialog/form-dialog.service";
import { of } from "rxjs";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../entity/database-entity.decorator";

describe("EntitySelectComponent", () => {
  let component: EntitySelectComponent<any, any>;
  let fixture: ComponentFixture<EntitySelectComponent<any, any>>;
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
    component = fixture.componentInstance;
    component.form = formControl;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("eventually loads all entities of the given type when the entity-type is set", fakeAsync(() => {
    component.entityType = TestEntity.ENTITY_TYPE;
    fixture.detectChanges();
    tick();
    expect(component.allEntities.length).toBe(test1Entities.length);
  }));

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    component.entityType = TestEntity.ENTITY_TYPE;
    expect(component.loading.value).toBe(true);
    tick();
    expect(component.loading.value).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    component.entityType = TestEntity.ENTITY_TYPE;
    tick();
    fixture.detectChanges();
    expect(component.availableOptions.value).toEqual(
      jasmine.arrayWithExactContents(test1Entities),
    );
  }));

  it("suggests all entities of multiple different types if configured", fakeAsync(() => {
    component.entityType = [TestEntity.ENTITY_TYPE, Test2Entity.ENTITY_TYPE];
    tick();
    fixture.detectChanges();

    expect(component.allEntities).toEqual(
      [...test1Entities, ...test2Entities].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
    expect(component.availableOptions.value).toEqual(
      [...test1Entities, ...test2Entities].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  }));

  it("should retain missing entity and show warning", fakeAsync(() => {
    const warnSpy = spyOn(Logging, "warn");
    component.entityType = TestEntity.ENTITY_TYPE;
    component.label = "test label";
    component.form.setValue([test1Entities[0].getId(), "missing_user"]);
    tick();
    fixture.detectChanges();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("ENTITY_SELECT"),
      "test label",
      "missing_user",
      jasmine.anything(),
    );
    expect(component.form.value).toEqual([
      test1Entities[0].getId(),
      "missing_user",
    ]);
    expect(component.hasInaccessibleEntities).toBeTrue();
  }));

  it("shows inactive entities according to the includeInactive state", fakeAsync(() => {
    test1Entities[0].isActive = false;
    test1Entities[2].isActive = false;
    component.entityType = TestEntity.ENTITY_TYPE;
    tick();

    expect(component.availableOptions.value.length).toEqual(
      test1Entities.length - 2,
    );

    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions.value.length).toEqual(
      test1Entities.length,
    );

    test1Entities[2].isActive = true;
    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions.value.length).toEqual(3);
  }));

  it("should update matchingInactive count when autocomplete filter changes", fakeAsync(() => {
    const testEntities = [
      TestEntity.create("AB"),
      TestEntity.create("AC"),
      TestEntity.create("X"),
    ];
    testEntities.forEach((e) => (e.inactive = true));
    spyOn(TestBed.inject(EntityMapperService), "loadType").and.resolveTo(
      testEntities,
    );

    component.entityType = TestEntity.ENTITY_TYPE;
    tick();
    expect(component.currentlyMatchingInactive).toBe(testEntities.length);

    component.recalculateMatchingInactive((o) => o["name"].startsWith("A"));
    expect(component.currentlyMatchingInactive).toBe(2);
  }));

  it("should show selected entities of type that is not configured", fakeAsync(() => {
    component.entityType = [TestEntity.ENTITY_TYPE];
    component.form.setValue([
      test1Entities[0].getId(),
      test2Entities[0].getId(),
    ]);
    tick();
    fixture.detectChanges();

    expect(component.form.value).toEqual(
      jasmine.arrayWithExactContents([
        test1Entities[0].getId(),
        test2Entities[0].getId(),
      ]),
    );
    expect(component.allEntities).toEqual(
      jasmine.arrayWithExactContents(test1Entities),
    );
    expect(component.availableOptions.value).toEqual(
      jasmine.arrayWithExactContents([...test1Entities, test2Entities[0]]),
    );
  }));

  it("should create a new entity when user selects 'add new' and apply input text", async () => {
    component.entityType = [TestEntity.ENTITY_TYPE];
    const formDialogSpy = spyOn(
      TestBed.inject(FormDialogService),
      "openFormPopup",
    );
    const savedEntity = new TestEntity("123");

    formDialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);
    const resultCancel = await component.createNewEntity("my new record");
    expect(resultCancel).toBeUndefined();

    formDialogSpy.and.returnValue({
      afterClosed: () => of(savedEntity),
    } as any);
    const resultSave = await component.createNewEntity("my new record");
    expect(resultSave).toEqual(savedEntity);
    expect(formDialogSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: "my new record" }),
    );
  });

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
