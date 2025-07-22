import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMatchingEntitiesComponent } from "./admin-matching-entities.component";
import { ConfigService } from "../../config/config.service";
import { BehaviorSubject } from "rxjs";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityRelationsService } from "../../entity/entity-mapper/entity-relations.service";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { Config } from "../../config/config";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormBuilder } from "@angular/forms";

const MOCK_ENTITY_TYPES = [TestEntity];

describe("AdminMatchingEntitiesComponent", () => {
  let component: AdminMatchingEntitiesComponent;
  let fixture: ComponentFixture<AdminMatchingEntitiesComponent>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;
  let mockEntityFormService: jasmine.SpyObj<EntityFormService>;

  beforeEach(async () => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = jasmine.createSpyObj(
      "ConfigService",
      ["saveConfig", "getAllConfigs", "exportConfig", "getConfig"],
      { configUpdates: mockConfigUpdated },
    );

    mockConfigService.getConfig.and.returnValue({});

    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    mockEntityFormService = jasmine.createSpyObj("EntityFormService", [
      "createEntityForm",
    ]);

    const mockEntityRegistry = jasmine.createSpyObj("EntityRegistry", [
      "getEntityTypes",
      "get",
    ]);
    mockEntityRegistry.getEntityTypes.and.returnValue(
      MOCK_ENTITY_TYPES.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );
    mockEntityRegistry.get.and.callFake((type) =>
      MOCK_ENTITY_TYPES.find((e) => e.ENTITY_TYPE === type),
    );

    await TestBed.configureTestingModule({
      imports: [AdminMatchingEntitiesComponent, FontAwesomeTestingModule],
      providers: [
        FormBuilder,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
        { provide: EntityFormService, useValue: mockEntityFormService },
        { provide: EntityRegistry, useValue: mockEntityRegistry },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
