import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditConfigurableEnumComponent } from "./edit-configurable-enum.component";
import { FormControl, FormGroup } from "@angular/forms";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntitySchemaField } from "../../../entity/schema/entity-schema-field";
import { Entity } from "../../../entity/model/entity";

describe("EditConfigurableEnumComponent", () => {
  let component: EditConfigurableEnumComponent;
  let fixture: ComponentFixture<EditConfigurableEnumComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditConfigurableEnumComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditConfigurableEnumComponent);
    component = fixture.componentInstance;
    initWithSchema({ innerDataType: "some-id" });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should extract the enum ID", () => {
    initWithSchema({ innerDataType: "some-id" });
    expect(component.enumId).toBe("some-id");

    initWithSchema({ dataType: "array", additional: "other-id" });
    expect(component.enumId).toBe("other-id");
  });

  it("should detect multi selection mode", () => {
    initWithSchema({ innerDataType: "some-id" });
    expect(component.multi).toBeFalse();

    initWithSchema({ dataType: "array", additional: "some-id" });
    expect(component.multi).toBeTrue();
  });

  function initWithSchema(schema: EntitySchemaField) {
    const fromGroup = new FormGroup({ test: new FormControl() });
    component.formControl = fromGroup.get("test") as FormControl;
    component.formFieldConfig = { id: "test", ...schema }; // EditComponents are ensure to receive fully extended formFieldConfig
    component.entity = new Entity();
    component.ngOnInit();
  }
});
