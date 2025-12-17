import { TestBed } from "@angular/core/testing";
import { InheritedValueService } from "./inherited-value.service";
import { AutomatedStatusUpdateConfigService } from "../automated-status-update/automated-status-update-config-service";
import { Entity } from "../../core/entity/model/entity";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { DefaultValueConfigInheritedField } from "./inherited-field-config";
import { EventEmitter } from "@angular/core";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { MatDialog } from "@angular/material/dialog";
import { UnsavedChangesService } from "../../core/entity-details/form/unsaved-changes.service";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ConfigService } from "../../core/config/config.service";
import { EntityAbility } from "../../core/permissions/ability/entity-ability";
import { DefaultValueStrategy } from "../../core/default-values/default-value-strategy.interface";
import { EMPTY } from "rxjs";

describe("Inherited Field Integration Tests", () => {
  let inheritedValueService: InheritedValueService;
  let automatedStatusService: AutomatedStatusUpdateConfigService;
  let mockEntityMapperService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapperService = jasmine.createSpyObj(["load", "receiveUpdates"]);
    mockEntityMapperService.receiveUpdates.and.returnValue(EMPTY);

    TestBed.configureTestingModule({
      providers: [
        InheritedValueService,
        AutomatedStatusUpdateConfigService,
        { provide: EntityMapperService, useValue: mockEntityMapperService },
        { provide: EntityRegistry, useValue: new Map() },
        { provide: MatDialog, useValue: jasmine.createSpyObj(["open"]) },
        {
          provide: UnsavedChangesService,
          useValue: jasmine.createSpyObj(["pending"]),
        },
        {
          provide: EntitySchemaService,
          useValue: jasmine.createSpyObj(["valueToEntityFormat"]),
        },
        {
          provide: ConfigService,
          useValue: jasmine.createSpyObj(["configUpdates"], {
            configUpdates: EMPTY,
          }),
        },
        { provide: EntityAbility, useValue: jasmine.createSpyObj(["can"]) },
        {
          provide: DefaultValueStrategy,
          useExisting: InheritedValueService,
          multi: true,
        },
      ],
    });
    inheritedValueService = TestBed.inject(InheritedValueService);
    automatedStatusService = TestBed.inject(AutomatedStatusUpdateConfigService);
  });

  it("should inherit value from same entity reference field", async () => {
    // given
    const sourceEntity = new Entity("source:1");
    sourceEntity["status"] = "active";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(sourceEntity));

    const config: DefaultValueConfigInheritedField = {
      sourceReferenceField: "parentRef",
      sourceValueField: "status",
    };

    const entity = new Entity();
    const form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        childStatus: new FormControl(null),
        parentRef: new FormControl("source:1"),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    const targetFormControl = form.formGroup.get("childStatus");

    // when
    await inheritedValueService.setDefaultValue(
      targetFormControl,
      {
        defaultValue: {
          mode: "inherited-field",
          config: config,
        },
      },
      form,
    );

    // then
    expect(targetFormControl.value).toBe("active");
    expect(mockEntityMapperService.load).toHaveBeenCalledWith(
      "source",
      "source:1",
    );
  });

  it("should apply value mapping when configured", async () => {
    // given
    const sourceEntity = new Entity("source:1");
    sourceEntity["status"] = "ACTIVE";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(sourceEntity));

    const config: DefaultValueConfigInheritedField = {
      sourceReferenceField: "parentRef",
      sourceValueField: "status",
      valueMapping: {
        ACTIVE: "in-progress",
        COMPLETED: "done",
      },
    };

    const entity = new Entity();
    const form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        childStatus: new FormControl(null),
        parentRef: new FormControl("source:1"),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    const targetFormControl = form.formGroup.get("childStatus");

    // when
    await inheritedValueService.setDefaultValue(
      targetFormControl,
      {
        defaultValue: {
          mode: "inherited-field",
          config: config,
        },
      },
      form,
    );

    // then
    expect(targetFormControl.value).toBe("in-progress");
  });

  it("should react to changes in source reference field", async () => {
    // given
    const sourceEntity1 = new Entity("source:1");
    sourceEntity1["status"] = "active";

    const sourceEntity2 = new Entity("source:2");
    sourceEntity2["status"] = "completed";

    mockEntityMapperService.load.and.callFake((entityConstructor, id) => {
      if (id === "source:1") return Promise.resolve(sourceEntity1);
      if (id === "source:2") return Promise.resolve(sourceEntity2);
      return Promise.resolve(null);
    });

    const config: DefaultValueConfigInheritedField = {
      sourceReferenceField: "parentRef",
      sourceValueField: "status",
    };

    const entity = new Entity();
    const form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        childStatus: new FormControl(null),
        parentRef: new FormControl("source:1"),
      }),
      onFormStateChange: new EventEmitter(),
      entity: entity,
      fieldConfigs: [],
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    const targetFormControl = form.formGroup.get("childStatus");
    const sourceRefControl = form.formGroup.get("parentRef");

    // when - initial setup
    await inheritedValueService.setDefaultValue(
      targetFormControl,
      {
        defaultValue: {
          mode: "inherited-field",
          config: config,
        },
      },
      form,
    );

    // then - initial value
    expect(targetFormControl.value).toBe("active");

    // when - change source reference
    sourceRefControl.setValue("source:2");
    await new Promise((resolve) => setTimeout(resolve, 0));

    // then - value should update
    expect(targetFormControl.value).toBe("completed");
  });
});
