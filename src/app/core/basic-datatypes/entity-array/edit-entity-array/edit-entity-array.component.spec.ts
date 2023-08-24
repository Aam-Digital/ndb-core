import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EditEntityArrayComponent } from "./edit-entity-array.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { setupEditComponent } from "../../../entity/default-datatype/edit-component.spec";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("EditEntityArrayComponent", () => {
  let component: EditEntityArrayComponent;
  let fixture: ComponentFixture<EditEntityArrayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditEntityArrayComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

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
});
