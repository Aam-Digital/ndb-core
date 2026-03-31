import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";

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
import { CurrentUserSubject } from "../../core/session/current-user-subject";

describe("PublicFormComponent", () => {
  let component: PublicFormComponent<TestEntity>;
  let fixture: ComponentFixture<PublicFormComponent<TestEntity>>;
  let initRemoteDBSpy: Mock;
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
    initRemoteDBSpy = vi.spyOn(dbResolver, "initDatabasesForAnonymous");

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

  it("should initialize component with values from PublicFormConfig once config is ready", async () => {
    vi.useFakeTimers();
    try {
      expect(component.entityFormEntries.length).toBe(0);
      testFormConfig.title = "Some test title";
      testFormConfig.entity = "TestEntity";

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.entityFormEntries[0].entity.getConstructor()).toBe(
        TestEntity,
      );
      expect(component.formConfig.title).toBe("Some test title");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should navigate to the success page and show the button if enabled", async () => {
    vi.useFakeTimers();
    try {
      testFormConfig.showSubmitAnotherButton = true;
      initComponent();
      await vi.advanceTimersByTimeAsync(0);
      const saveSpy = vi.spyOn(
        TestBed.inject(EntityFormService),
        "saveChanges",
      );
      const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");
      saveSpy.mockResolvedValue(undefined);
      (
        component.entityFormEntries[0].form.formGroup.get("name") as any
      ).setValue("some name");

      component.submit();

      expect(saveSpy).toHaveBeenCalledWith(
        component.entityFormEntries[0].form,
        component.entityFormEntries[0].entity,
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(navigateSpy).toHaveBeenCalledWith(
        ["/public-form/submission-success"],
        { queryParams: { showSubmitAnotherButton: true } },
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should navigate to the success page and hide the button if disabled", async () => {
    vi.useFakeTimers();
    try {
      testFormConfig.showSubmitAnotherButton = false;
      initComponent();
      await vi.advanceTimersByTimeAsync(0);
      const saveSpy = vi.spyOn(
        TestBed.inject(EntityFormService),
        "saveChanges",
      );
      const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate");
      saveSpy.mockResolvedValue(undefined);
      (
        component.entityFormEntries[0].form.formGroup.get("name") as any
      ).setValue("some name");

      component.submit();

      expect(saveSpy).toHaveBeenCalledWith(
        component.entityFormEntries[0].form,
        component.entityFormEntries[0].entity,
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(navigateSpy).toHaveBeenCalledWith(
        ["/public-form/submission-success"],
        { queryParams: { showSubmitAnotherButton: false } },
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set created.by metadata from public form id for anonymous submission", async () => {
    vi.useFakeTimers();
    try {
      (TestBed.inject(CurrentUserSubject) as any).next(undefined);

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      (
        component.entityFormEntries[0].form.formGroup.get("name") as any
      ).setValue("some name");

      await component.submit();
      await vi.advanceTimersByTimeAsync(0);

      const savedEntity = await TestBed.inject(EntityMapperService).load(
        TestEntity,
        component.entityFormEntries[0].entity.getId(),
      );

      expect(savedEntity.created?.by).toBe(`PublicForm:${FORM_ID}`);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should show an inline error and not reset when trying to submit invalid form", async () => {
    vi.useFakeTimers();
    try {
      initComponent();
      await vi.advanceTimersByTimeAsync(0);
      const saveSpy = vi.spyOn(
        TestBed.inject(EntityFormService),
        "saveChanges",
      );
      saveSpy.mockImplementation(() => {
        throw new InvalidFormFieldError();
      });
      (
        component.entityFormEntries[0].form.formGroup.get("name") as any
      ).setValue("some name");

      component.submit();

      expect(saveSpy).toHaveBeenCalledWith(
        component.entityFormEntries[0].form,
        component.entityFormEntries[0].entity,
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(component.validationError).toBe(true);
      expect(
        component.entityFormEntries[0].form.formGroup.get("name").value,
      ).toEqual("some name");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should reset the form when clicking reset", async () => {
    vi.useFakeTimers();
    try {
      initComponent();
      await vi.advanceTimersByTimeAsync(0);
      (
        component.entityFormEntries[0].form.formGroup.get("name") as any
      ).setValue("some name");
      expect(
        component.entityFormEntries[0].form.formGroup.get("name").value,
      ).toEqual("some name");

      component.reset();
      await vi.advanceTimersByTimeAsync(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should set default value for field", async () => {
    vi.useFakeTimers();
    try {
      const config = new PublicFormConfig();
      config.entity = TestEntity.ENTITY_TYPE;
      config.columns = [
        {
          fields: [
            {
              id: "name",
              defaultValue: {
                mode: "static",
                config: { value: "default name" },
              },
            },
          ],
        },
      ];
      vi.spyOn(TestBed.inject(EntityMapperService), "load").mockResolvedValue(
        config,
      );

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      expect(
        component.entityFormEntries[0].form.formGroup.get("name").value,
      ).toEqual("default name");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should migrate old PublicFormConfig format to be backwards compatible", async () => {
    vi.useFakeTimers();
    try {
      const legacyConfig = {
        _id: "PublicFormConfig:old-form",
        title: "Old Form",
        entity: TestEntity.ENTITY_TYPE,
        columns: [["name"]], // string[][];
        prefilled: { name: "default name" }, // { [key in string]: any };
      };
      vi.spyOn(TestBed.inject(EntityMapperService), "load").mockResolvedValue(
        legacyConfig as any,
      );

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      expect(
        component.entityFormEntries[0].form.formGroup.get("name").value,
      ).toEqual("default name");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should throw an error when do not have permissions to submit the form", async () => {
    vi.useFakeTimers();
    try {
      TestBed.inject(EntityAbility).update([
        {
          subject: "Child",
          action: "create",
        },
      ]);
      testFormConfig.entity = "School";
      testFormConfig.title = "Some test title";

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      expect(component).toBeDefined();
      expect(component.error).toBe("no_permissions");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should display not found error when config does not exist", async () => {
    vi.useFakeTimers();
    try {
      const entityMapperSpy = vi
        .spyOn(TestBed.inject(EntityMapperService), "loadType")
        .mockResolvedValue([]);

      initComponent();
      await vi.advanceTimersByTimeAsync(0);

      expect(entityMapperSpy).toHaveBeenCalledWith(PublicFormConfig);
      expect(component.error).toBe("not_found");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should add a hidden field when a field in prefilled is not part of visible fields", async () => {
    vi.useFakeTimers();
    try {
      const config = new PublicFormConfig();
      config.columns = [{ fields: [] }];
      config.prefilled = {
        other: { mode: "static", config: { value: "default value" } },
      };

      initComponent(config);
      await vi.advanceTimersByTimeAsync(0);

      const lastColumn = component.formConfig.columns.at(-1);
      expect(lastColumn?.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "other",
            defaultValue: {
              mode: "static",
              config: { value: "default value" },
            },
            hideFromForm: true,
          }),
        ]),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update defaultValue for a field in prefilled that is already visible", async () => {
    vi.useFakeTimers();
    try {
      const config = new PublicFormConfig();
      config.columns = [
        {
          fields: [
            {
              id: "other",
              defaultValue: {
                mode: "static",
                config: { value: "base default" },
              },
            },
          ],
        },
      ];
      config.prefilled = {
        other: { mode: "static", config: { value: "prefilled default" } },
      };

      initComponent(config);
      await vi.advanceTimersByTimeAsync(0);

      expect(
        component.entityFormEntries[0].form.formGroup.get("other").value,
      ).toEqual("prefilled default");
    } finally {
      vi.useRealTimers();
    }
  });

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
