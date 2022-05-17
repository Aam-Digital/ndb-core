import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityArrayComponent } from "./edit-entity-array.component";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { EntityUtilsModule } from "../../entity-utils.module";
import { setupEditComponent } from "../edit-component.spec";
import { MockedTestingModule } from "../../../../../utils/mocked-testing.module";

describe("EditEntityArrayComponent", () => {
  let component: EditEntityArrayComponent;
  let fixture: ComponentFixture<EditEntityArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityUtilsModule, MockedTestingModule.withState()],
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
});
