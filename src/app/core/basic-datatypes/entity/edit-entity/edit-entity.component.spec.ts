import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";

import { FormControl, NgControl } from "@angular/forms";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";
import { DatabaseEntity } from "../../../entity/database-entity.decorator";
import { setupCustomFormControlEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { Entity } from "../../../entity/model/entity";
import { LoginState } from "../../../session/session-states/login-state.enum";
import { EntityDatatype } from "../entity.datatype";
import {
  EditEntityComponent,
  applyTextToCreatedEntity,
} from "./edit-entity.component";
import { Logging } from "#src/app/core/logging/logging.service";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { FormDialogService } from "#src/app/core/form-dialog/form-dialog.service";
import { of } from "rxjs";

describe("EditEntityComponent", () => {
  let component: EditEntityComponent;
  let fixture: ComponentFixture<EditEntityComponent<any>>;
  let test1Entities: TestEntity[];
  let test2Entities: Test2Entity[];
  let formControl: FormControl;

  @DatabaseEntity("Test2Entity")
  class Test2Entity extends TestEntity {}

  beforeEach(() => {
    formControl = new FormControl();

    test1Entities = ["Abc", "Bcd", "Abd", "Aba"].map((s) => {
      return new TestEntity(s);
    });
    test2Entities = [new Test2Entity(), new Test2Entity()];
    const otherEntities: Entity[] = [createEntityOfType("OtherEntityType")];

    TestBed.configureTestingModule({
      imports: [
        EditEntityComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, [
          ...test1Entities,
          ...test2Entities,
          ...otherEntities,
        ]),
      ],
      providers: [
        { provide: NgControl, useValue: { control: formControl } },
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EditEntityComponent);
    component = fixture.componentInstance;

    setupCustomFormControlEditComponent(component, "testProperty", {
      additional: TestEntity.ENTITY_TYPE,
    });
    component.ngControl = { control: formControl } as any;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  function testMultiFlag(
    formFieldConfig: Partial<FormFieldConfig>,
    expectedMulti: boolean,
  ) {
    component.multi = !expectedMulti;
    component.formFieldConfig = { id: "test", ...formFieldConfig };
    component.ngOnInit();
    expect(!!component.multi).toBe(expectedMulti);
  }

  it("should detect 'multi' select for array datatypes", () => {
    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
        isArray: true,
      },
      true,
    );

    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
      },
      false,
    );
  });

  it("should smartly distribute the input text to all toStringAttributes when creating a new record", async () => {
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

  it("should not be in loading-state when all data is received", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    tick();
    expect(component.loading()).toBe(false);
  }));

  it("should suggest all entities after an initial load", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.autoDetectChanges();
    tick();
    expect(component.availableOptions()).toEqual(
      jasmine.arrayWithExactContents(test1Entities),
    );
  }));

  it("suggests all entities of multiple different types if configured", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", [TestEntity.ENTITY_TYPE, Test2Entity.ENTITY_TYPE]);
    fixture.autoDetectChanges();
    tick();

    expect(component.availableOptions()).toEqual(
      [...test1Entities, ...test2Entities].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      ),
    );
  }));

  it("should retain missing entity and show warning", fakeAsync(() => {
    const warnSpy = spyOn(Logging, "warn");
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    component.formFieldConfig = { id: "test", label: "test label" };
    component.formControl().setValue([test1Entities[0].getId(), "missing_user"]);
    fixture.autoDetectChanges();
    tick();

    expect(warnSpy).toHaveBeenCalledWith(
      jasmine.stringContaining("ENTITY_SELECT"),
      "test label",
      "missing_user",
      jasmine.anything(),
    );
    expect(component.formControl().value).toEqual([
      test1Entities[0].getId(),
      "missing_user",
    ]);
    expect(component.hasInaccessibleEntities).toBeTrue();
  }));

  it("shows inactive entities according to the includeInactive state", fakeAsync(() => {
    test1Entities[0].isActive = false;
    test1Entities[2].isActive = false;
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.autoDetectChanges();
    tick();

    expect(component.availableOptions().length).toEqual(
      test1Entities.length - 2,
    );
    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions().length).toEqual(test1Entities.length);

    test1Entities[2].isActive = true;
    component.toggleIncludeInactive();
    tick();
    expect(component.availableOptions().length).toEqual(3);
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

    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.autoDetectChanges();
    tick();
    expect(component.currentlyMatchingInactive()).toBe(3);

    component.recalculateMatchingInactive((o) => o["name"].startsWith("A"));
    tick();
    expect(component.currentlyMatchingInactive()).toBe(2);
  }));

  it("should show selected entities of type that is not configured", fakeAsync(() => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    component.formControl().setValue([test1Entities[0].getId(), test2Entities[0].getId()]);
    fixture.autoDetectChanges();
    tick();

    expect(component.formControl().value).toEqual(
      jasmine.arrayWithExactContents([
        test1Entities[0].getId(),
        test2Entities[0].getId(),
      ]),
    );
    expect(component.availableOptions()).toEqual(
      jasmine.arrayWithExactContents([...test1Entities, test2Entities[0]]),
    );
  }));

  it("should create a new entity when user selects 'add new' and apply input text", async () => {
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.detectChanges();
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
});
