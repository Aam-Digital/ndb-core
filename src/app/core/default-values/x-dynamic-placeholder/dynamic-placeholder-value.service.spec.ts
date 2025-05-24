import { TestBed } from "@angular/core/testing";

import { DynamicPlaceholderValueService } from "./dynamic-placeholder-value.service";
import { Entity } from "app/core/entity/model/entity";
import { CurrentUserSubject } from "app/core/session/current-user-subject";
import { testDefaultValueCase } from "../default-value-service/default-value.service.spec";
import { DefaultValueService } from "../default-value-service/default-value.service";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { PrebuiltFilterConfig } from "app/core/entity-list/EntityListConfig";
import { PLACEHOLDERS } from "app/core/entity/schema/entity-schema-field";
import { Note } from "app/child-dev-project/notes/model/note";

describe("DynamicPlaceholderValueService", () => {
  let service: DynamicPlaceholderValueService;
  let defaultValueService: DefaultValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserSubject,
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

  it("should be created", () => {
    expect(service).toBeTruthy();
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
    jasmine.clock().mockDate(mockDate);

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

    jasmine.clock().uninstall();
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

    let defaultValString = service.getPlaceholderValue(placeholderUserFilter.default);
    expect(defaultValString).toEqual(user.getId());
  });
});
