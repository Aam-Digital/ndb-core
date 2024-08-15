import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  LocationProperties,
  MapPropertiesPopupComponent,
} from "./map-properties-popup.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../../core/entity/database-entity.decorator";
import { Child } from "../../../../child-dev-project/children/model/child";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

describe("MapPropertiesPopupComponent", () => {
  let component: MapPropertiesPopupComponent;
  let fixture: ComponentFixture<MapPropertiesPopupComponent>;
  let properties: LocationProperties = {};
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MapPropertiesPopupComponent>>;

  beforeEach(async () => {
    Child.schema.set("address", {
      label: "Address",
      dataType: "location",
    });
    Child.schema.set("otherAddress", {
      label: "Other address",
      dataType: "location",
    });
    properties[Child.ENTITY_TYPE] = ["address"];
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
    Child.schema.delete("address");
    Child.schema.delete("otherAddress");
    TestEntity.schema.delete("address");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display all available properties with their labels", () => {
    expect(component.entityProperties).toEqual([
      {
        entity: Child,
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
    component.entityProperties.find(({ entity }) => entity === Child).selected =
      ["otherAddress"];

    component.closeDialog();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      [Child.ENTITY_TYPE]: ["otherAddress"],
      [TestEntity.ENTITY_TYPE]: ["address"],
    });
  });
});
