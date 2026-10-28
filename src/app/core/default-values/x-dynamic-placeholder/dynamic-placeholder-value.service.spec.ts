import { TestBed } from "@angular/core/testing";

import { DynamicPlaceholderValueService } from "./dynamic-placeholder-value.service";
import { Entity } from "app/core/entity/model/entity";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { testDefaultValueCase } from "../default-value-service/default-value.service.test-utils";
import { DefaultValueService } from "../default-value-service/default-value.service";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { PrebuiltFilterConfig } from "app/core/entity-list/EntityListConfig";
import { PLACEHOLDERS } from "app/core/entity/schema/entity-schema-field";
import { Note } from "app/child-dev-project/notes/model/note";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { DefaultDatatype } from "app/core/entity/default-datatype/default.datatype";
import { StringDatatype } from "app/core/basic-datatypes/string/string.datatype";

describe("DynamicPlaceholderValueService", () => {
  let service: DynamicPlaceholderValueService;
  let defaultValueService: DefaultValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserSubject,
        { provide: DefaultDatatype, useClass: DefaultDatatype, multi: true },
        { provide: DefaultDatatype, useClass: StringDatatype, multi: true },
        {
          provide: DefaultValueStrategy,
          useClass: DynamicPlaceholderValueService,
          multi: true,
        },
      ],
    });
    // @ts-ignore
    service = TestBed.inject<DefaultValueStrategy[]>(DefaultValueStrategy)[0];
    defaultValueService = TestBed.inject(DefaultValueService);
  });

  it("should do nothing, if value is not a valid PLACEHOLDER", () => {
    return testDefaultValueCase(
      defaultValueService,
      {
        defaultValue: {
          mode: "dynamic",
          config: { value: "invalid-placeholder" },
        },
      },
      null,
    );
  });

  it("should set current USER, if PLACEHOLDER.CURRENT_USER is selected", () => {
    let user = new Entity();
    TestBed.inject(CurrentUserSubject).next(user);

    return testDefaultValueCase(
      defaultValueService,
      {
        defaultValue: {
          mode: "dynamic",
          config: { value: "$current_user" },
        },
      },
      user.getId(),
    );
  });

  it("should set current Date, if PLACEHOLDER.NOW is selected", async () => {
    const mockDate = new Date();
    vi.setSystemTime(mockDate);

    await testDefaultValueCase(
      defaultValueService,
      {
        defaultValue: {
          mode: "dynamic",
          config: { value: "$now" },
        },
      },
      mockDate,
    );

    vi.useRealTimers();
  });

  it("should return current USER string, if PLACEHOLDER.CURRENT_USER is selected", () => {
    let user = new Entity();
    TestBed.inject(CurrentUserSubject).next(user);

    const placeholderUserFilter = {
      id: "userID",
      type: "prebuilt",
      label: "Current User",
      default: PLACEHOLDERS.CURRENT_USER,
      options: [{}, {}],
    } as PrebuiltFilterConfig<Note>;

    let defaultValString = service.getPlaceholderValue(
      placeholderUserFilter.default,
    );
    expect(defaultValString).toEqual(user.getId());
  });

  describe("resolveRecordPlaceholders", () => {
    const condition = { other: { $in: ["$current_record.other"] } };

    it("should resolve the placeholders with the values of the given record", () => {
      const record = TestEntity.create({ other: "BERLIN" });

      expect(service.resolveRecordPlaceholders(condition, record)).toEqual({
        other: { $in: ["BERLIN"] },
      });
    });

    it("should leave out what refers to the record, if there is no record", () => {
      expect(service.resolveRecordPlaceholders(condition, undefined)).toEqual(
        {},
      );
    });
  });
});
