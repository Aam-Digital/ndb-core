import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { entityAbilityFactory } from "../../permissions/ability/testing-entity-ability-factory";

describe("ImportSelectTypeComponent", () => {
  let component: ImportEntityTypeComponent;
  let fixture: ComponentFixture<ImportEntityTypeComponent>;

  class TestEntity extends Entity {
    static override _isCustomizedType = true; // set by config service applying custom definitions
    static override label = "some-label"; // set by config service applying custom definitions
  }

  let mockRegistry: EntityRegistry;
  let testTypes: {
    key: string;
    value: EntityConstructor;
  }[] = [
    { key: "GeneralType", value: TestEntity },
    { key: "TechnicalType", value: ConfigurableEnum },
  ];

  beforeEach(async () => {
    mockRegistry = new EntityRegistry();
    testTypes.forEach((t) => mockRegistry.add(t.key, t.value));

    await TestBed.configureTestingModule({
      imports: [
        ImportEntityTypeComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: EntityRegistry, useValue: mockRegistry },
        { provide: EntityAbility, useFactory: entityAbilityFactory },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should hide types the user cannot create", () => {
    const ability = TestBed.inject(EntityAbility);
    ability.update([
      { subject: "all", action: "manage" },
      { subject: TestEntity.ENTITY_TYPE, action: "create", inverted: true },
    ]);
    ability.initialized = true;

    expect(component.hideTypeOption(TestEntity)).toBe(true);
    expect(component.hideTypeOption(ConfigurableEnum)).toBe(false);
  });
});
