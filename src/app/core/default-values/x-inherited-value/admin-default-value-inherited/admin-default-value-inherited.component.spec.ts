import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminDefaultValueInheritedComponent } from "./admin-default-value-inherited.component";
import { EntityDatatype } from "../../../basic-datatypes/entity/entity.datatype";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { EntityRegistry } from "../../../entity/database-entity.decorator";

describe("AdminDefaultValueInheritedComponent", () => {
  let component: AdminDefaultValueInheritedComponent;
  let fixture: ComponentFixture<AdminDefaultValueInheritedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDefaultValueInheritedComponent],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDefaultValueInheritedComponent);
    component = fixture.componentInstance;

    component.entityType = Entity;
    component.inheritedFieldSelectElement = jasmine.createSpyObj(["open"]);

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load inheritance attribute options when entityType is set", () => {
    component.entityType = {
      schema: new Map([
        ["ref1", { dataType: EntityDatatype.dataType }],
        ["otherField", { dataType: "string" }],
        ["ref2", { dataType: EntityDatatype.dataType }],
      ]),
    } as any; // Mock entityType with schema

    component.ngOnChanges({
      entityType: { currentValue: component.entityType } as any,
    });

    expect(component.availableInheritanceAttributes).toEqual(["ref1", "ref2"]);
  });

  it("should load inheritance field options when localAttribute is set", () => {
    component.entityType = {
      schema: new Map([
        [
          "ref1",
          { dataType: EntityDatatype.dataType, additional: "OtherType" },
        ],
      ]),
    } as any; // Mock entityType with schema
    const OtherTypeMock: EntityConstructor = {
      schema: new Map([
        ["field1", { dataType: "string", label: "F1" }],
        ["fieldWithoutLabel", { dataType: "string" }],
        ["field2", { dataType: "string", label: "F2" }],
      ]),
    } as any;
    spyOn(TestBed.inject(EntityRegistry), "get").and.returnValue(OtherTypeMock);

    component.form.get("localAttribute").setValue("ref1");

    expect(component.currentInheritanceFields).toEqual({
      localAttribute: "ref1",
      referencedEntityType: OtherTypeMock,
      availableFields: ["field1", "field2"],
    });
  });
});
