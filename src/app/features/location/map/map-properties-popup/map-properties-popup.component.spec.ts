import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  LocationProperties,
  MapPropertiesPopupComponent,
} from "./map-properties-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  DatabaseEntity,
  entityRegistry,
  EntityRegistry,
} from "../../../../core/entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { Entity } from "../../../../core/entity/model/entity";
import { DatabaseField } from "../../../../core/entity/database-field.decorator";

describe("MapPropertiesPopupComponent", () => {
  let component: MapPropertiesPopupComponent;
  let fixture: ComponentFixture<MapPropertiesPopupComponent>;
  let properties: LocationProperties = {};
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MapPropertiesPopupComponent>>;

  @DatabaseEntity("TestEntityWithAddress")
  class TestEntityWithAddress extends Entity {
    @DatabaseField({
      label: "Address",
      dataType: "location",
    })
    address;

    @DatabaseField({
      label: "Other address",
      dataType: "location",
    })
    otherAddress;
  }

  beforeEach(async () => {
    properties[TestEntityWithAddress.ENTITY_TYPE] = ["address"];
    TestEntity.schema.set("address", {
      label: "School address",
      dataType: "location",
    });
    properties[TestEntity.ENTITY_TYPE] = ["address"];
    mockDialogRef = jasmine.createSpyObj(["close"]);
    await TestBed.configureTestingModule({
      imports: [
        MapPropertiesPopupComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: properties },
        { provide: EntityRegistry, useValue: entityRegistry },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPropertiesPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestEntity.schema.delete("address");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available properties with their labels", () => {
    expect(component.entityProperties).toEqual([
      {
        entity: TestEntityWithAddress,
        properties: [
          { name: "address", label: "Address" },
          { name: "otherAddress", label: "Other address" },
        ],
        selected: ["address"],
      },
      {
        entity: TestEntity,
        properties: [{ name: "address", label: "School address" }],
        selected: ["address"],
      },
    ]);
  });

  it("should emit the selected properties", () => {
    component.entityProperties.find(
      ({ entity }) => entity === TestEntityWithAddress,
    ).selected = ["otherAddress"];

    component.closeDialog();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      [TestEntityWithAddress.ENTITY_TYPE]: ["otherAddress"],
      [TestEntity.ENTITY_TYPE]: ["address"],
    });
  });
});
