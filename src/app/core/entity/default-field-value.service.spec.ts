import { TestBed } from "@angular/core/testing";

import { DefaultFieldValueService } from "./default-field-value.service";
import { CurrentUserSubject } from "../session/current-user-subject";
import { of } from "rxjs";
import { HandleDefaultFieldValuesUseCase } from "./default-field-value/handle-default-field-values.usecase";
import { FormBuilder, FormControl } from "@angular/forms";
import { Entity } from "./model/entity";
import { EntitySchemaField } from "./schema/entity-schema-field";
import anything = jasmine.anything;

describe("DefaultFieldValueService", () => {
  let service: DefaultFieldValueService;
  let mockHandleDefaultFieldValuesUseCase: jasmine.SpyObj<HandleDefaultFieldValuesUseCase>;

  beforeEach(() => {
    mockHandleDefaultFieldValuesUseCase = jasmine.createSpyObj({
      handleFormGroup: jasmine.createSpy(),
    });
    mockHandleDefaultFieldValuesUseCase.handleFormGroup.calls.saveArgumentsByValue();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HandleDefaultFieldValuesUseCase,
          useValue: mockHandleDefaultFieldValuesUseCase,
        },
        { provide: CurrentUserSubject, useValue: of(null) },
      ],
    });
    service = TestBed.inject(DefaultFieldValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call DefaultFieldValuesUseCase if defaultFieldValue is set", () => {
    // given
    let formGroup = new FormBuilder().group({ test: {} });
    const schema: EntitySchemaField = {
      defaultFieldValue: {
        mode: "static",
        value: "bar",
      },
    };
    Entity.schema.set("test", schema);

    // when
    service.handle(formGroup, new Entity());

    // then
    expect(
      mockHandleDefaultFieldValuesUseCase.handleFormGroup,
    ).toHaveBeenCalled();

    Entity.schema.delete("test");
  });

  it("should not call DefaultFieldValuesUseCase if defaultValue is set", () => {
    // given
    let formGroup = new FormBuilder().group({ test: {} });
    const schema: EntitySchemaField = {
      defaultValue: 1,
    };
    Entity.schema.set("test", schema);

    // when
    service.handle(formGroup, new Entity());

    // then
    expect(
      mockHandleDefaultFieldValuesUseCase.handleFormGroup,
    ).not.toHaveBeenCalled();

    expect(formGroup.get("test").value).toEqual(1);

    Entity.schema.delete("test");
  });

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
      defaultFieldValue: {
        mode: "static",
        value: "bar",
      },
    });

    Entity.schema.set("test2", {
      defaultFieldValue: {
        mode: "dynamic",
        value: "bar",
      },
    });

    Entity.schema.set("test3", {
      defaultFieldValue: {
        mode: "inherited",
        value: "bar",
      },
    });

    Entity.schema.set("test4", {
      defaultFieldValue: {
        mode: "dynamic",
        value: "bar",
      },
    });

    Entity.schema.set("test5", {
      defaultFieldValue: {
        mode: "inherited",
        value: "bar",
      },
    });

    // when
    service.handle(formGroup, new Entity());

    // then
    expect(
      mockHandleDefaultFieldValuesUseCase.handleFormGroup,
    ).toHaveBeenCalledTimes(2);

    expect(
      mockHandleDefaultFieldValuesUseCase.handleFormGroup.calls.argsFor(0),
    ).toEqual([
      anything(),
      [
        ["test3", anything()],
        ["test5", anything()],
      ],
      anything(),
    ]);

    expect(
      mockHandleDefaultFieldValuesUseCase.handleFormGroup.calls.argsFor(1),
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
