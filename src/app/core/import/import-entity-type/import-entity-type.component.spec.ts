import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfigurableEnum } from "../../basic-datatypes/configurable-enum/configurable-enum";

describe("ImportSelectTypeComponent", () => {
  let component: ImportEntityTypeComponent;
  let fixture: ComponentFixture<ImportEntityTypeComponent>;

  class TestEntity extends Entity {
    static override _isCustomizedType = true; // set by config service applying custom definitions
    static override label = "some-label"; // set by config service applying custom definitions
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

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
