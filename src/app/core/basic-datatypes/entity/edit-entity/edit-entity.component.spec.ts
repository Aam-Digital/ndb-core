import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditEntityComponent } from "./edit-entity.component";
import { setupEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityDatatype } from "../entity.datatype";
import { FormFieldConfig } from "../../../common-components/entity-form/FormConfig";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";

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
    component.entityName = TestEntity.ENTITY_TYPE;
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
    expect(!!component.multi).toBe(expectedMulti);
  }

  it("should detect 'multi' select for array datatypes", () => {
    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
        isArray: true,
      },
      true,
    );

    testMultiFlag(
      {
        dataType: EntityDatatype.dataType,
        isArray: true,
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
