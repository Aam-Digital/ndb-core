import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { Entity, EntityConstructor } from "../../../core/entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfigurableEnum } from "../../../core/configurable-enum/configurable-enum";

describe("ImportSelectTypeComponent", () => {
  let component: ImportEntityTypeComponent;
  let fixture: ComponentFixture<ImportEntityTypeComponent>;

  class TestEntity extends Entity {
    static _isCustomizedType = true; // set by config service applying custom definitions
  }

  let mockRegistry: EntityRegistry;
  let testTypes: { key: string; value: EntityConstructor }[] = [
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
      providers: [{ provide: EntityRegistry, useValue: mockRegistry }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should offer any entityType to select for experts", () => {
    component.expertMode = true;

    expect(component.entityTypes).toEqual(testTypes);
  });

  it("should only offer entityTypes mentioned in custom config by default", () => {
    component.expertMode = false;

    expect(component.entityTypes).toEqual([testTypes[0]]);
  });
});
