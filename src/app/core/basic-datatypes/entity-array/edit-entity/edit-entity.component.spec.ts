import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditEntityComponent } from "./edit-entity.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { setupEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { ArrayDatatype } from "../../array/array.datatype";
import { EntityDatatype } from "../../entity/entity.datatype";
import { EntityArrayDatatype } from "../entity-array.datatype";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";

describe("EditEntityComponent", () => {
  let component: EditEntityComponent;
  let fixture: ComponentFixture<EditEntityComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditEntityComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntityComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    component.entityName = Child.ENTITY_TYPE;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  function testMultiFlag(
    formFieldConfig: Partial<FormFieldConfig>,
    expectedMulti: boolean,
  ) {
    component.multi = !expectedMulti;
    component.formFieldConfig = { id: "test", ...formFieldConfig };
    component.ngOnInit();
    expect(component.multi).toBe(expectedMulti);
  }

  it("should detect 'multi' select for array datatypes", () => {
    testMultiFlag(
      {
        dataType: ArrayDatatype.dataType,
        innerDataType: EntityDatatype.dataType,
      },
      true,
    );

    testMultiFlag(
      {
        dataType: EntityArrayDatatype.dataType,
      },
      true,
    );

    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
      },
      false,
    );
  });
});
