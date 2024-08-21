import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { AdminEntityComponent } from "./admin-entity.component";
import { AdminEntityDetailsComponent } from "../admin-entity-details/admin-entity-details/admin-entity-details.component";
import { ConfigService } from "../../config/config.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../entity/entity-mapper/mock-entity-mapper-service";
import {
  EntityDetailsConfig,
  Panel,
} from "../../entity-details/EntityDetailsConfig";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { Entity } from "../../entity/model/entity";
import { DatabaseField } from "../../entity/database-field.decorator";
import { Config } from "../../config/config";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { CoreModule } from "../../core.module";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { MatTabsModule } from "@angular/material/tabs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

describe("AdminEntityComponent", () => {
  let component: AdminEntityComponent;
  let fixture: ComponentFixture<AdminEntityComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let entityMapper: MockEntityMapperService;

  let config;
  let viewConfig: EntityDetailsConfig;
  let viewConfigId, entityConfigId;

  @DatabaseEntity("AdminTest")
  class AdminTestEntity extends Entity {
    static readonly ENTITY_TYPE = "AdminTest";
    static label = "Admin Test";

    @DatabaseField({ label: "Name" }) name: string;
  }

  beforeEach(() => {
    viewConfigId = `view:${AdminTestEntity.route.substring(1)}/:id`;
    entityConfigId = `entity:${AdminTestEntity.ENTITY_TYPE}`;
    viewConfig = {
      entityType: AdminTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };
    config = {
      [viewConfigId]: { component: "EntityDetails", config: viewConfig },
      [entityConfigId]: {},
    };
    const mockActivatedRoute = {
      queryParams: of({ mode: "list" }),
    };
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue(config[viewConfigId]);

    entityMapper = mockEntityMapper([new Config(Config.CONFIG_KEY, config)]);

    TestBed.configureTestingModule({
      imports: [
        AdminEntityDetailsComponent,
        CoreTestingModule,
        CoreModule,
        EntityTypeLabelPipe,
        MatTabsModule,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: entityMapper,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityActionsService,
          useValue: jasmine.createSpyObj(["showSnackbarConfirmationWithUndo"]),
        },
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
      ],
    });
    fixture = TestBed.createComponent(AdminEntityComponent);
    component = fixture.componentInstance;

    component.entityType = AdminTestEntity.ENTITY_TYPE;

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset all entity schema changes on cancel", () => {
    // simulate schema changes done through the field config popup form
    AdminTestEntity.schema.set("testCancelField", { label: "New field" });
    const existingField = AdminTestEntity.schema.get("name");
    const originalLabelOfExisting = existingField.label;
    existingField.label = "Changed existing field";
    component.configEntitySettings = { label: "new entity label" };

    component.cancel();

    expect(AdminTestEntity.schema.has("testCancelField")).toBeFalse();
    expect(AdminTestEntity.schema.get("name").label).toBe(
      originalLabelOfExisting,
    );
    expect(AdminTestEntity.label).toBe("Admin Test");
    console.log(AdminTestEntity, JSON.stringify(AdminTestEntity.schema));

    // cleanup
    AdminTestEntity.schema.delete("testCancelField");
  });

  it("should save schema and view config", waitForAsync(async () => {
    const newSchemaField: EntitySchemaField = {
      label: "New field",
    };
    AdminTestEntity.schema.set("testSaveField", newSchemaField);

    const newPanel: Panel = {
      title: "New Panel",
      components: [],
    };
    component.configDetailsView.panels.push(newPanel);

    await component.save();

    await fixture.whenStable();

    const expectedViewConfig = {
      entityType: AdminTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }, newPanel],
    };

    const expectedEntityConfig = {
      label: "Admin Test",
      labelPlural: "Admin Test",
      icon: undefined,
      toStringAttributes: ["entityId"],
      hasPII: false,
      attributes: jasmine.objectContaining({
        testSaveField: newSchemaField,
      }),
    };

    const actual: Config = entityMapper.get(
      Config.ENTITY_TYPE,
      Config.CONFIG_KEY,
    ) as Config;
    expect(actual.data[viewConfigId]).toEqual({
      component: "EntityDetails",
      config: expectedViewConfig,
    });
    expect(actual.data[entityConfigId]).toEqual(expectedEntityConfig);
    // TODO: this expectation is not useful yet:
    expect(component.configEntitySettings).toEqual(component.entityConstructor);

    // cleanup:
    AdminTestEntity.schema.delete("testSaveField");
  }));
});
