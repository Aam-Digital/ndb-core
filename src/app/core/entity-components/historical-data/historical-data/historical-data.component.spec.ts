import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { HistoricalDataComponent } from "./historical-data.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { HistoricalDataModule } from "../historical-data.module";
import { ColumnDescriptionInputType } from "../../entity-subrecord/column-description-input-type.enum";
import { Entity } from "../../../entity/entity";
import { HistoricalEntityData } from "../historical-entity-data";
import moment from "moment";

describe("HistoricalDataComponent", () => {
  let component: HistoricalDataComponent;
  let fixture: ComponentFixture<HistoricalDataComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);

    await TestBed.configureTestingModule({
      declarations: [HistoricalDataComponent],
      imports: [HistoricalDataModule, NoopAnimationsModule],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should add mapping function to configurable enum types", () => {
    const config = {
      config: [
        {
          inputType: ColumnDescriptionInputType.CONFIGURABLE_ENUM,
          name: "configurableEnumSelect",
          label: "Configurable Enum Select",
          enumId: "configurableEnumId",
          tooltip: "A configurable enum select",
        },
      ],
    } as any;
    component.onInitFromDynamicConfig(config);

    const valueFunction = component.columns[0].valueFunction;
    expect(valueFunction).toBeDefined();
    const exampleEntity = {
      configurableEnumSelect: { label: "Expected value", id: "Wrong value" },
    } as any;
    expect(valueFunction(exampleEntity)).toEqual("Expected value");
  });

  it("should filter the historical data", fakeAsync(() => {
    const entity = new Entity();
    const relatedData = new HistoricalEntityData();
    relatedData.relatedEntity = entity.getId();
    const unrelatedData = new HistoricalEntityData();
    unrelatedData.relatedEntity = "otherId";
    mockEntityMapper.loadType.and.resolveTo([relatedData, unrelatedData]);

    component.onInitFromDynamicConfig({ entity: entity });
    tick();

    expect(component.entries).toEqual([relatedData]);
  }));

  it("should generate new records with a link to the passed entity", () => {
    const entity = new Entity();
    component.onInitFromDynamicConfig({ entity: entity });

    const newEntry = component.getNewEntryFunction()();

    expect(newEntry.relatedEntity).toBe(entity.getId());
    expect(moment(newEntry.date).isSame(new Date(), "day")).toBeTrue();
  });
});
