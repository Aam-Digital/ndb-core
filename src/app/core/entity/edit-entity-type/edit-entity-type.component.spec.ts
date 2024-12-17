import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityTypeComponent } from "./edit-entity-type.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { setupEditComponent } from "../default-datatype/edit-component.spec";

describe("EditConfigurableEnumComponent", () => {
  let component: EditEntityTypeComponent;
  let fixture: ComponentFixture<EditEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEntityTypeComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityTypeComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
