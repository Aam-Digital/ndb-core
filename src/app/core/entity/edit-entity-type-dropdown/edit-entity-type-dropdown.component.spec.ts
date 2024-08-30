import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditEntityTypeDropdownComponent } from "./edit-entity-type-dropdown.component";
import { FormControl, FormGroup } from "@angular/forms";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntitySchemaField } from "../schema/entity-schema-field";
import { Entity } from "../model/entity";

describe("EditConfigurableEnumComponent", () => {
  let component: EditEntityTypeDropdownComponent;
  let fixture: ComponentFixture<EditEntityTypeDropdownComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        EditEntityTypeDropdownComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntityTypeDropdownComponent);
    component = fixture.componentInstance;
    initWithSchema({});
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  function initWithSchema(schema: EntitySchemaField) {
    const fromGroup = new FormGroup({ test: new FormControl() });
    component.formControl = fromGroup.get("test") as FormControl;
    component.formFieldConfig = { id: "test", ...schema }; // EditComponents are ensure to receive fully extended formFieldConfig
    component.entity = new Entity();
    component.ngOnInit();
  }
});
