import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminMatchingEntitiesComponent } from "./admin-matching-entities.component";
import { ConfigService } from "../../../core/config/config.service";
import { BehaviorSubject } from "rxjs";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntityRelationsService } from "../../../core/entity/entity-mapper/entity-relations.service";
import { EntityFormService } from "../../../core/common-components/entity-form/entity-form.service";
import { Config } from "../../../core/config/config";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormBuilder } from "@angular/forms";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { CurrentUserSubject } from "#src/app/core/session/current-user-subject";

const MOCK_ENTITY_TYPES = [TestEntity];

const MOCK_CONFIG = {
  leftSide: { entityType: "Child" },
  rightSide: { entityType: "School" },
  onMatch: {
    newEntityType: "ChildSchoolRelation",
    newEntityMatchPropertyLeft: "childId",
    newEntityMatchPropertyRight: "schoolId",
  },
};

describe("AdminMatchingEntitiesComponent", () => {
  let component: AdminMatchingEntitiesComponent;
  let fixture: ComponentFixture<AdminMatchingEntitiesComponent>;
  let mockConfigService: any;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockEntityRelationsService: any;
  let mockEntityFormService: any;

  beforeEach(async () => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = {
      saveConfig: vi.fn().mockName("ConfigService.saveConfig"),
      getAllConfigs: vi.fn().mockName("ConfigService.getAllConfigs"),
      exportConfig: vi.fn().mockName("ConfigService.exportConfig"),
      getConfig: vi.fn().mockName("ConfigService.getConfig"),
      configUpdates: mockConfigUpdated,
    };

    mockConfigService.getConfig.mockReturnValue(MOCK_CONFIG);

    mockEntityRelationsService = {
      getEntityTypesReferencingType: vi
        .fn()
        .mockName("EntityRelationsService.getEntityTypesReferencingType"),
    };
    mockEntityRelationsService.getEntityTypesReferencingType.mockReturnValue(
      [],
    );

    mockEntityFormService = {
      createEntityForm: vi.fn().mockName("EntityFormService.createEntityForm"),
    };

    const mockEntityRegistry = {
      getEntityTypes: vi.fn().mockName("EntityRegistry.getEntityTypes"),
      get: vi.fn().mockName("EntityRegistry.get"),
    };
    mockEntityRegistry.getEntityTypes.mockReturnValue(
      MOCK_ENTITY_TYPES.map((x) => ({ key: x.ENTITY_TYPE, value: x })),
    );
    mockEntityRegistry.get.mockImplementation((type) =>
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
        SyncStateSubject,
        CurrentUserSubject,
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
