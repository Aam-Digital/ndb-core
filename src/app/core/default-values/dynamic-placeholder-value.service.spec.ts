import { TestBed } from "@angular/core/testing";

import { DynamicPlaceholderValueService } from "./dynamic-placeholder-value.service";
import { Entity } from "../entity/model/entity";
import { CurrentUserSubject } from "../session/current-user-subject";
import { testDefaultValueCase } from "./default-value.service.spec";
import { DefaultValueService } from "./default-value.service";
import { InheritedValueService } from "./inherited-value.service";
import { ConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum.service";
import { createTestingConfigurableEnumService } from "../basic-datatypes/configurable-enum/configurable-enum-testing";
import { PrebuiltFilterConfig } from "../entity-list/EntityListConfig";
import { PLACEHOLDERS } from "../entity/schema/entity-schema-field";
import { Note } from "app/child-dev-project/notes/model/note";
import { empty } from "rxjs";

describe("DynamicPlaceholderValueService", () => {
  let service: DynamicPlaceholderValueService;
  let defaultValueService: DefaultValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUserSubject,
        {
          provide: InheritedValueService,
          useValue: jasmine.createSpyObj(["initEntityForm"]),
        },
        {
          provide: ConfigurableEnumService,
          useValue: createTestingConfigurableEnumService(),
        },
      ],
    });
    service = TestBed.inject(DynamicPlaceholderValueService);
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
          value: "invalid-placeholder",
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
          value: "$current_user",
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
          value: "$now",
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

    const emptyDefaultFilter = {
      id: "userID",
      type: "prebuilt",
      label: "Current User",
      default: "",
      options: [{}, {}],
    } as PrebuiltFilterConfig<Note>;

    let defaultValString = service.getDefaultValueString(placeholderUserFilter);
    let emptyDefaultString = service.getDefaultValueString(emptyDefaultFilter);
    expect(defaultValString).toEqual(user.getId());
    expect(emptyDefaultString).toEqual("");
  });
});
