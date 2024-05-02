import { TestBed } from "@angular/core/testing";

import { DefaultValueService } from "./default-value.service";
import { HandleDefaultValuesUseCase } from "./default-field-value/handle-default-values.usecase";
import { FormBuilder, FormControl } from "@angular/forms";
import { Entity } from "./model/entity";
import { EntitySchemaField } from "./schema/entity-schema-field";
import anything = jasmine.anything;

describe("DefaultValueService", () => {
  let service: DefaultValueService;
  let mockHandleDefaultValuesUseCase: jasmine.SpyObj<HandleDefaultValuesUseCase>;

  beforeEach(() => {
    mockHandleDefaultValuesUseCase = jasmine.createSpyObj({
      handleFormGroup: jasmine.createSpy(),
    });
    mockHandleDefaultValuesUseCase.handleFormGroup.calls.saveArgumentsByValue();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HandleDefaultValuesUseCase,
          useValue: mockHandleDefaultValuesUseCase,
        },
      ],
    });
    service = TestBed.inject(DefaultValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call HandleDefaultValuesUseCase if defaultValue is set", () => {
    // given
    let formGroup = new FormBuilder().group({ test: {} });
    const schema: EntitySchemaField = {
      defaultValue: {
        mode: "static",
        value: "bar",
      },
    };
    Entity.schema.set("test", schema);

    // when
    service.handle(formGroup, new Entity());

    // then
    expect(mockHandleDefaultValuesUseCase.handleFormGroup).toHaveBeenCalled();

    Entity.schema.delete("test");
  });

  // The inherited mode listen to changes and loads the entities async.
  // When a static value is processed, before the inheritance hook is registered, the loading does not trigger.
  it("should apply inherited modes before static and dynamic modes", () => {
    // given
    let formGroup = new FormBuilder().group({
      test1: new FormControl(),
      test2: new FormControl(),
      test3: new FormControl(),
      test4: new FormControl(),
      test5: new FormControl(),
    });

    Entity.schema.set("test1", {
      defaultValue: {
        mode: "static",
        value: "bar",
      },
    });

    Entity.schema.set("test2", {
      defaultValue: {
        mode: "dynamic",
        value: "bar",
      },
    });

    Entity.schema.set("test3", {
      defaultValue: {
        mode: "inherited",
        value: "bar",
      },
    });

    Entity.schema.set("test4", {
      defaultValue: {
        mode: "dynamic",
        value: "bar",
      },
    });

    Entity.schema.set("test5", {
      defaultValue: {
        mode: "inherited",
        value: "bar",
      },
    });

    // when
    service.handle(formGroup, new Entity());

    // then
    expect(
      mockHandleDefaultValuesUseCase.handleFormGroup,
    ).toHaveBeenCalledTimes(2);

    expect(
      mockHandleDefaultValuesUseCase.handleFormGroup.calls.argsFor(0),
    ).toEqual([
      anything(),
      [
        ["test3", anything()],
        ["test5", anything()],
      ],
      anything(),
    ]);

    expect(
      mockHandleDefaultValuesUseCase.handleFormGroup.calls.argsFor(1),
    ).toEqual([
      anything(),
      [
        ["test1", anything()],
        ["test2", anything()],
        ["test4", anything()],
      ],
      anything(),
    ]);

    Entity.schema.delete("test1");
    Entity.schema.delete("test2");
    Entity.schema.delete("test3");
    Entity.schema.delete("test4");
    Entity.schema.delete("test5");
  });
});
