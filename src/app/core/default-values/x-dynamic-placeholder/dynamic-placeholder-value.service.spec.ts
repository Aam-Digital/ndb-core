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

    describe("referring to a field of a linked record", () => {
      const berlin = TestEntity.create({ other: "BERLIN" });
      const hamburg = TestEntity.create({
        other: "HAMBURG",
        refMixed: ["Note:1", "Note:2"],
      });
      const alsoHamburg = TestEntity.create({
        other: "HAMBURG",
        refMixed: ["Note:2", "Note:3"],
      });
      const linkedRecords = new Map(
        [berlin, hamburg, alsoHamburg].map((r) => [r.getId(), r]),
      );

      it.each([
        [
          "the value of the record linked in a single-value field",
          { other: "$current_record.ref.other" },
          { ref: berlin.getId() },
          { other: "BERLIN" },
        ],
        [
          "all values of a multi-value field of the linked record",
          { _id: { $in: ["$current_record.ref.refMixed"] } },
          { ref: hamburg.getId() },
          { _id: { $in: ["Note:1", "Note:2"] } },
        ],
        [
          "the values of all linked records, each only once",
          { _id: { $in: ["$current_record.refMixed.refMixed"] } },
          { refMixed: [hamburg.getId(), alsoHamburg.getId()] },
          { _id: { $in: ["Note:1", "Note:2", "Note:3"] } },
        ],
        [
          "the values of the linked records that are available only",
          { other: { $in: ["$current_record.refMixed.other"] } },
          { refMixed: [berlin.getId(), "TestEntity:not-loaded"] },
          { other: { $in: ["BERLIN"] } },
        ],
        [
          "the linked record itself",
          { ref: "$current_record.ref._id" },
          { ref: berlin.getId() },
          { ref: berlin.getId() },
        ],
      ])("uses %s", (_, linkedCondition, values, expected) => {
        const record = TestEntity.create(values as Partial<TestEntity>);

        expect(
          service.resolveRecordPlaceholders(
            linkedCondition,
            record,
            linkedRecords,
          ),
        ).toEqual(expected);
      });

      it.each([
        ["no record is linked", {}],
        ["the linked record is not available", { ref: "TestEntity:other" }],
        ["the field of the linked record is empty", { ref: berlin.getId() }],
      ])("leaves out the row if %s", (_, values) => {
        const record = TestEntity.create(values);

        expect(
          service.resolveRecordPlaceholders(
            {
              _id: { $in: ["$current_record.ref.refMixed"] },
              name: "fixed",
            },
            record,
            linkedRecords,
          ),
        ).toEqual({ name: "fixed" });
      });

      it("does not follow more than one link", () => {
        const record = TestEntity.create({ ref: hamburg.getId() });

        expect(
          service.resolveRecordPlaceholders(
            { other: "$current_record.ref.ref.other" },
            record,
            linkedRecords,
          ),
        ).toEqual({});
      });
    });

    const recordValues = {
      location: "BERLIN",
      locations: ["BERLIN", "HAMBURG"],
      name: "Anna",
    };

    it.each([
      [
        "keeps a condition without placeholders",
        { level: { $in: ["COUNTRY"] } },
        { level: { $in: ["COUNTRY"] } },
      ],
      [
        "replaces a placeholder in an $in list",
        { primaryLocation: { $in: ["$current_record.location"] } },
        { primaryLocation: { $in: ["BERLIN"] } },
      ],
      [
        "spreads the values of a multi-value field into the list",
        { primaryLocation: { $in: ["OTHER", "$current_record.locations"] } },
        { primaryLocation: { $in: ["OTHER", "BERLIN", "HAMBURG"] } },
      ],
      [
        "replaces a plain placeholder value",
        { name: "$current_record.name" },
        { name: "Anna" },
      ],
      [
        "replaces placeholders nested in $or, $elemMatch and negations",
        {
          $or: [
            { tags: { $elemMatch: { $in: ["$current_record.location"] } } },
            { region: { $not: { $in: ["$current_record.location"] } } },
          ],
        },
        {
          $or: [
            { tags: { $elemMatch: { $in: ["BERLIN"] } } },
            { region: { $not: { $in: ["BERLIN"] } } },
          ],
        },
      ],
    ])("%s", (_, input, expected) => {
      const original = structuredClone(input);

      expect(
        service.resolveRecordPlaceholders(
          input,
          Object.assign(new TestEntity(), recordValues),
        ),
      ).toEqual(expected);
      // the condition usually is shared config, so it must not be changed in place
      expect(input).toEqual(original);
    });

    it.each([[undefined], [null], [""], [[]]])(
      "leaves out the row referencing an empty field (%j)",
      (emptyValue) => {
        const withEmptyField = {
          level: { $in: ["COUNTRY"] },
          primaryLocation: { $in: ["$current_record.location"] },
        };

        expect(
          service.resolveRecordPlaceholders(
            withEmptyField,
            Object.assign(new TestEntity(), { location: emptyValue }),
          ),
        ).toEqual({ level: { $in: ["COUNTRY"] } });
      },
    );

    it.each([
      [
        "all of $or if one alternative cannot be applied (which then does not restrict anything)",
        {
          level: "COUNTRY",
          $or: [{ name: "A" }, { location: "$current_record.location" }],
        },
        { level: "COUNTRY" },
      ],
      [
        "only the condition of $and that cannot be applied",
        {
          $and: [
            { level: "COUNTRY" },
            { location: "$current_record.location" },
          ],
        },
        { $and: [{ level: "COUNTRY" }] },
      ],
      [
        "only the condition of $nor that cannot be applied",
        { $nor: [{ name: "A" }, { location: "$current_record.location" }] },
        { $nor: [{ name: "A" }] },
      ],
      [
        "only the unresolved part of an alternative",
        {
          $or: [
            { level: "COUNTRY", location: "$current_record.location" },
            { name: "A" },
          ],
        },
        { $or: [{ level: "COUNTRY" }, { name: "A" }] },
      ],
      [
        "all alternatives, together with the list of alternatives",
        {
          level: "COUNTRY",
          $or: [{ location: "$current_record.location" }],
        },
        { level: "COUNTRY" },
      ],
      [
        "a placeholder nested anywhere in a row's value",
        {
          level: "COUNTRY",
          location: { $not: { $in: ["OTHER", "$current_record.location"] } },
        },
        { level: "COUNTRY" },
      ],
      [
        "every row (nothing is left to apply)",
        { location: "$current_record.location" },
        {},
      ],
    ])("leaves out %s", (_, input, expected) => {
      expect(
        service.resolveRecordPlaceholders(input, new TestEntity()),
      ).toEqual(expected);
    });
  });
});
