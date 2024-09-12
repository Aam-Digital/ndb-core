import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityTypeDropdownComponent } from "./edit-entity-type-dropdown.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { setupEditComponent } from "../default-datatype/edit-component.spec";

describe("EditConfigurableEnumComponent", () => {
  let component: EditEntityTypeDropdownComponent;
  let fixture: ComponentFixture<EditEntityTypeDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditEntityTypeDropdownComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityTypeDropdownComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
