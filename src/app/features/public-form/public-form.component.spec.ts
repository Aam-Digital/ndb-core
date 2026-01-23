import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { PublicFormComponent } from "./public-form.component";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { PublicFormConfig } from "./public-form-config";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityFormService } from "../../core/common-components/entity-form/entity-form.service";
import { ConfigService } from "../../core/config/config.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { InvalidFormFieldError } from "../../core/common-components/entity-form/invalid-form-field.error";
import { TestEntity } from "../../utils/test-utils/TestEntity";
import { EntityAbility } from "app/core/permissions/ability/entity-ability";
import { DatabaseResolverService } from "../../core/database/database-resolver.service";
import { getDefaultConfigEntity } from "../../core/config/testing-config-service";

describe("PublicFormComponent", () => {
  let component: PublicFormComponent<TestEntity>;
  let fixture: ComponentFixture<PublicFormComponent<TestEntity>>;
  let initRemoteDBSpy: jasmine.Spy;
  let testFormConfig: PublicFormConfig;

  const FORM_ID = "form-id";

  beforeEach(() => {
    testFormConfig = new PublicFormConfig(FORM_ID);
    testFormConfig.title = "test form";
    testFormConfig.entity = TestEntity.ENTITY_TYPE;
    testFormConfig.columns = [
      {
        fields: [
          {
            id: "name",
            defaultValue: { mode: "static", config: { value: "default name" } },
          },
          "category",
        ],
      },
    ];

    TestBed.configureTestingModule({
      imports: [PublicFormComponent, MockedTestingModule.withState()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: new Map([["id", FORM_ID]]),
              queryParamMap: new Map([["childId", "Child:3"]]),
              queryParams: { childId: "Child:3" },
            },
          },
        },
      ],
    }).compileComponents();

    const dbResolver = TestBed.inject(DatabaseResolverService);
    dbResolver.initDatabasesForAnonymous = () => null;
    initRemoteDBSpy = spyOn(dbResolver, "initDatabasesForAnonymous");

    fixture = TestBed.createComponent(PublicFormComponent<TestEntity>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize for remote DB on startup", () => {
    expect(initRemoteDBSpy).toHaveBeenCalled();
  });

  it("should initialize component with values from PublicFormConfig once config is ready", fakeAsync(() => {
    expect(component.entityFormEntries.length).toBe(0);
    testFormConfig.title = "Some test title";
    testFormConfig.entity = "TestEntity";

    initComponent();
    tick();

    expect(component.entityFormEntries[0].entity.getConstructor()).toBe(
      TestEntity,
    );
    expect(component.formConfig.title).toBe("Some test title");
  }));

  it("should navigate to the success page and show the button if enabled", fakeAsync(() => {
    testFormConfig.showSubmitAnotherButton = true;
    initComponent();
    tick();
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    saveSpy.and.resolveTo();
    (component.entityFormEntries[0].form.formGroup.get("name") as any).setValue(
      "some name",
    );

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(
      component.entityFormEntries[0].form,
      component.entityFormEntries[0].entity,
    );
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(
      ["/public-form/submission-success"],
      { queryParams: { showSubmitAnotherButton: true } },
    );
  }));

  it("should navigate to the success page and hide the button if disabled", fakeAsync(() => {
    testFormConfig.showSubmitAnotherButton = false;
    initComponent();
    tick();
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    saveSpy.and.resolveTo();
    (component.entityFormEntries[0].form.formGroup.get("name") as any).setValue(
      "some name",
    );

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(
      component.entityFormEntries[0].form,
      component.entityFormEntries[0].entity,
    );
    tick();
    expect(navigateSpy).toHaveBeenCalledWith(
      ["/public-form/submission-success"],
      { queryParams: { showSubmitAnotherButton: false } },
    );
  }));

  it("should show an inline error and not reset when trying to submit invalid form", fakeAsync(() => {
    initComponent();
    tick();
    const saveSpy = spyOn(TestBed.inject(EntityFormService), "saveChanges");
    saveSpy.and.throwError(new InvalidFormFieldError());
    (component.entityFormEntries[0].form.formGroup.get("name") as any).setValue(
      "some name",
    );

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(
      component.entityFormEntries[0].form,
      component.entityFormEntries[0].entity,
    );
    tick();
    expect(component.validationError).toBeTrue();
    expect(
      component.entityFormEntries[0].form.formGroup.get("name"),
    ).toHaveValue("some name");
  }));

  it("should reset the form when clicking reset", fakeAsync(() => {
    initComponent();
    tick();
    (component.entityFormEntries[0].form.formGroup.get("name") as any).setValue(
      "some name",
    );
    expect(
      component.entityFormEntries[0].form.formGroup.get("name"),
    ).toHaveValue("some name");

    component.reset();
    tick();
  }));

  it("should set default value for field", fakeAsync(() => {
    const config = new PublicFormConfig();
    config.entity = TestEntity.ENTITY_TYPE;
    config.columns = [
      {
        fields: [
          {
            id: "name",
            defaultValue: { mode: "static", config: { value: "default name" } },
          },
        ],
      },
    ];
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(config);

    initComponent();
    tick();

    expect(
      component.entityFormEntries[0].form.formGroup.get("name"),
    ).toHaveValue("default name");
  }));

  it("should migrate old PublicFormConfig format to be backwards compatible", fakeAsync(() => {
    const legacyConfig = {
      _id: "PublicFormConfig:old-form",
      title: "Old Form",
      entity: TestEntity.ENTITY_TYPE,
      columns: [["name"]], // string[][];
      prefilled: { name: "default name" }, // { [key in string]: any };
    };
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(
      legacyConfig as any,
    );

    initComponent();
    tick();

    expect(
      component.entityFormEntries[0].form.formGroup.get("name"),
    ).toHaveValue("default name");
  }));

  it("should throw an error when do not have permissions to submit the form", fakeAsync(() => {
    TestBed.inject(EntityAbility).update([
      {
        subject: "Child",
        action: "create",
      },
    ]);
    testFormConfig.entity = "School";
    testFormConfig.title = "Some test title";

    initComponent();
    tick();

    expect(component).toBeDefined();
    expect(component.error).toBe("no_permissions");
  }));

  it("should display not found error when config does not exist", fakeAsync(() => {
    const entityMapperSpy = spyOn(
      TestBed.inject(EntityMapperService),
      "loadType",
    ).and.resolveTo([]);

    initComponent();
    tick();

    expect(entityMapperSpy).toHaveBeenCalledWith(PublicFormConfig);
    expect(component.error).toBe("not_found");
  }));

  it("should add a hidden field when a field in prefilled is not part of visible fields", fakeAsync(() => {
    const config = new PublicFormConfig();
    config.columns = [{ fields: [] }];
    config.prefilled = {
      other: { mode: "static", config: { value: "default value" } },
    };

    initComponent(config);
    tick();

    const lastColumn = component.formConfig.columns.at(-1);
    expect(lastColumn?.fields).toContain(
      jasmine.objectContaining({
        id: "other",
        defaultValue: { mode: "static", config: { value: "default value" } },
        hideFromForm: true,
      }),
    );
  }));

  it("should add hidden prefilled field for related entity when query param exists", fakeAsync(() => {
    testFormConfig.linkedEntities = ["childId"];

    initComponent();
    tick();

    const lastColumn = component.formConfig.columns.at(-1);
    expect(lastColumn?.fields).toContain(
      jasmine.objectContaining({
        id: "childId",
        defaultValue: { mode: "static", config: { value: "Child:3" } },
        hideFromForm: true,
      }),
    );
  }));

  it("should process configured URL parameters and create prefilled fields for multi-entity magic links", fakeAsync(() => {
    // Configure which entities are allowed to be linked (security feature)
    testFormConfig.linkedEntities = [
      "childId",
      "schoolId",
      "eventId",
      "teacherId",
    ];

    // Create a mock ActivatedRoute with multiple URL parameters
    const multiParamRoute = {
      snapshot: {
        paramMap: new Map([["id", FORM_ID]]),
        queryParamMap: new Map([
          ["childId", "Child:123"],
          ["schoolId", "School:456"],
          ["eventId", "Event:789"],
          ["teacherId", "Teacher:101"],
        ]),
        queryParams: {
          childId: "Child:123",
          schoolId: "School:456",
          eventId: "Event:789",
          teacherId: "Teacher:101",
        },
      },
    };

    // Replace the route in the component
    component["route"] = multiParamRoute as any;

    initComponent();
    tick();

    const lastColumn = component.formConfig.columns.at(-1);

    // Expected URL parameters and their values
    const expectedParams = {
      childId: "Child:123",
      schoolId: "School:456",
      eventId: "Event:789",
      teacherId: "Teacher:101",
    };

    // Verify all configured URL parameters were processed and added as hidden fields
    Object.entries(expectedParams).forEach(([paramId, paramValue]) => {
      expect(lastColumn?.fields).toContain(
        jasmine.objectContaining({
          id: paramId,
          defaultValue: { mode: "static", config: { value: paramValue } },
          hideFromForm: true,
        }),
      );
    });
  }));

  it("should ignore unconfigured URL parameters for security", fakeAsync(() => {
    // Configure only specific entities
    testFormConfig.linkedEntities = ["childId", "schoolId"];

    const securityTestRoute = {
      snapshot: {
        paramMap: new Map([["id", FORM_ID]]),
        queryParamMap: new Map([
          ["childId", "Child:123"],
          ["schoolId", "School:456"],
          ["hackerId", "Hacker:malicious"],
          ["adminId", "Admin:dangerous"],
        ]),
        queryParams: {
          childId: "Child:123", // Allowed
          schoolId: "School:456", // Allowed
          hackerId: "Hacker:malicious", //should be ignored
          adminId: "Admin:dangerous", //should be ignored
        },
      },
    };

    component["route"] = securityTestRoute as any;

    initComponent();
    tick();

    const lastColumn = component.formConfig.columns.at(-1);

    // Should process allowed parameters
    expect(lastColumn?.fields).toContain(
      jasmine.objectContaining({
        id: "childId",
        defaultValue: { mode: "static", config: { value: "Child:123" } },
        hideFromForm: true,
      }),
    );

    // Should ignore unauthorized parameters
    const unauthorizedFields = lastColumn?.fields.filter((field) => {
      const fieldId = typeof field === "string" ? field : field.id;
      return fieldId === "hackerId" || fieldId === "adminId";
    });
    expect(unauthorizedFields.length).toBe(0);
  }));

  it("should update defaultValue for a field in prefilled that is already visible", fakeAsync(() => {
    const config = new PublicFormConfig();
    config.columns = [
      {
        fields: [
          {
            id: "other",
            defaultValue: { mode: "static", config: { value: "base default" } },
          },
        ],
      },
    ];
    config.prefilled = {
      other: { mode: "static", config: { value: "prefilled default" } },
    };

    initComponent(config);
    tick();

    expect(
      component.entityFormEntries[0].form.formGroup.get("other"),
    ).toHaveValue("prefilled default");
  }));

  it("should migrate linkedEntities from old FormFieldConfig[] format to string[] format", () => {
    const { migratePublicFormConfig } = require("./public-form.component");

    const oldFormatConfig = new PublicFormConfig();
    oldFormatConfig.linkedEntities = [
      { id: "participant", hideFromForm: true, additional: "Participant" },
      { id: "event", hideFromForm: true, additional: "Event" },
    ] as any;

    const migrated = migratePublicFormConfig(oldFormatConfig);

    expect(migrated.linkedEntities).toEqual(["participant", "event"]);
  });

  it("should keep linkedEntities if already in string[] format", () => {
    const { migratePublicFormConfig } = require("./public-form.component");

    const newFormatConfig = new PublicFormConfig();
    newFormatConfig.linkedEntities = ["participant", "event"];

    const migrated = migratePublicFormConfig(newFormatConfig);

    expect(migrated.linkedEntities).toEqual(["participant", "event"]);
  });

  async function initComponent(config: PublicFormConfig = testFormConfig) {
    config.route = config.route ?? FORM_ID;
    config.entity = config.entity ?? TestEntity.ENTITY_TYPE;
    await TestBed.inject(EntityMapperService).save(config);
    const configService = TestBed.inject(ConfigService);
    configService.entityUpdated.next(getDefaultConfigEntity());
  }
});
