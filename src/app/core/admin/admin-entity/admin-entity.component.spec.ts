import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { AdminEntityComponent } from "./admin-entity.component";
import { ConfigService } from "../../config/config.service";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { Config } from "../../config/config";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { CoreModule } from "../../core.module";
import { CoreTestingModule } from "../../../utils/core-testing.module";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import {
  EntityDetailsConfig,
  Panel,
} from "../../entity-details/EntityDetailsConfig";
import { Entity } from "../../entity/model/entity";
import { MatTabsModule } from "@angular/material/tabs";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { DatabaseField } from "../../entity/database-field.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminEntityComponent", () => {
  let component: AdminEntityComponent;
  let fixture: ComponentFixture<AdminEntityComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  let config;
  let viewConfig: EntityDetailsConfig;
  let viewConfigId, entityConfigId;

  @DatabaseEntity("AdminTest")
  class AdminTestEntity extends Entity {
    static readonly ENTITY_TYPE = "AdminTest";

    @DatabaseField({ label: "Name" }) name: string;
  }

  beforeEach(() => {
    viewConfigId = `view:${AdminTestEntity.route.substring(1)}/:id`;
    entityConfigId = `entity:${AdminTestEntity.ENTITY_TYPE}`;
    viewConfig = {
      entity: AdminTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }],
    };
    config = {
      [viewConfigId]: { component: "EntityDetails", config: viewConfig },
      [entityConfigId]: {},
    };

    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue(config[viewConfigId]);

    TestBed.configureTestingModule({
      imports: [
        AdminEntityComponent,
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
          useValue: mockEntityMapper([new Config(Config.CONFIG_KEY, config)]),
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityActionsService,
          useValue: jasmine.createSpyObj(["showSnackbarConfirmationWithUndo"]),
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

  it("should add new panel (tab) to config", () => {
    component.createPanel();

    expect(component.configDetailsView.panels.length).toBe(
      viewConfig.panels.length + 1,
    );
  });

  it("should add new section (component in panel) to config", () => {
    component.addSection(component.configDetailsView.panels[0]);

    expect(component.configDetailsView.panels[0].components.length).toBe(1);
  });

  it("should reset all entity schema changes on cancel", () => {
    // simulate schema changes done through the field config popup form
    AdminTestEntity.schema.set("testField", { label: "New field" });
    const existingField = AdminTestEntity.schema.get("name");
    const originalLabelOfExisting = existingField.label;
    existingField.label = "Changed existing field";

    component.cancel();

    expect(AdminTestEntity.schema.has("testField")).toBeFalse();
    expect(AdminTestEntity.schema.get("name").label).toBe(
      originalLabelOfExisting,
    );
  });

  it("should save schema and view config", fakeAsync(() => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const saveSpy = spyOn(entityMapper, "save");

    const newSchemaField: EntitySchemaField = {
      _isCustomizedField: true,
      label: "New field",
    };
    AdminTestEntity.schema.set("testField", newSchemaField);

    const newPanel: Panel = {
      title: "New Panel",
      components: [],
    };
    component.configDetailsView.panels.push(newPanel);

    component.save();
    tick();

    const expectedViewConfig = {
      entity: AdminTestEntity.ENTITY_TYPE,
      panels: [{ title: "Tab 1", components: [] }, newPanel],
    };
    const expectedEntityConfig = {
      attributes: jasmine.objectContaining({
        testField: newSchemaField,
      }),
    };

    expect(saveSpy).toHaveBeenCalled();
    const actualSaved: Config = saveSpy.calls.mostRecent().args[0] as Config;
    expect(actualSaved.getId(true)).toBe(
      Entity.createPrefixedId(Config.ENTITY_TYPE, Config.CONFIG_KEY),
    );
    expect(actualSaved.data[viewConfigId]).toEqual({
      component: "EntityDetails",
      config: expectedViewConfig,
    });
    expect(actualSaved.data[entityConfigId]).toEqual(expectedEntityConfig);

    AdminTestEntity.schema.delete("testField");
  }));
});
