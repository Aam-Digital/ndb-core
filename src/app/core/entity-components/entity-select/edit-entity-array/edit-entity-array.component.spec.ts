import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityArrayComponent } from "./edit-entity-array.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { setupEditComponent } from "../../entity-utils/dynamic-form-components/edit-component.spec";
import {
  MockedTestingModule,
  TEST_USER,
} from "../../../../utils/mocked-testing.module";
import { entityEntitySchemaDatatype } from "../../../entity/schema-datatypes/datatype-entity";
import { User } from "../../../user/user";

describe("EditEntityArrayComponent", () => {
  let component: EditEntityArrayComponent;
  let fixture: ComponentFixture<EditEntityArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEntityArrayComponent, MockedTestingModule.withState()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntityArrayComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    component.entityName = Child.ENTITY_TYPE;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set $current_user default value", () => {
    setupEditComponent(component, "testProperty", {
      additional: User.ENTITY_TYPE,
      defaultValue: entityEntitySchemaDatatype.PLACEHOLDERS.CURRENT_USER,
    });
    component.ngOnInit();
    expect(component.formControl.value).toEqual([TEST_USER]);
  });

  it("should set $current_user default value on mixed entity array", () => {
    setupEditComponent(component, "testProperty", {
      additional: ["OtherEntityType", User.ENTITY_TYPE],
      defaultValue: entityEntitySchemaDatatype.PLACEHOLDERS.CURRENT_USER,
    });
    component.ngOnInit();
    expect(component.formControl.value).toEqual([TEST_USER]);
  });
});
