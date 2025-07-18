import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMatchingEntitiesComponent } from "./admin-matching-entities.component";
import { ConfigService } from "../../config/config.service";
import { BehaviorSubject } from "rxjs";
import { Config } from "../../config/config";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityRelationsService } from "../../entity/entity-mapper/entity-relations.service";

describe("AdminMatchingEntitiesComponent", () => {
  let component: AdminMatchingEntitiesComponent;
  let fixture: ComponentFixture<AdminMatchingEntitiesComponent>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockConfigUpdated: BehaviorSubject<Config>;
  let mockEntityRelationsService: jasmine.SpyObj<EntityRelationsService>;

  beforeEach(async () => {
    mockConfigUpdated = new BehaviorSubject<Config>(null);
    mockConfigService = jasmine.createSpyObj(
      ["saveConfig", "getAllConfigs", "exportConfig", "getConfig"],
      {
        configUpdates: mockConfigUpdated,
      },
    );
    mockEntityRelationsService = jasmine.createSpyObj(
      "EntityRelationsService",
      ["getEntityTypesReferencingType"],
    );
    await TestBed.configureTestingModule({
      imports: [AdminMatchingEntitiesComponent],
      providers: [
        EntityRegistry,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EntityRelationsService,
          useValue: mockEntityRelationsService,
        },
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
