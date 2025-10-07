import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditTextComponent } from "./edit-text.component";

describe("EditTextComponent", () => {
  let component: EditTextComponent;
  let fixture: ComponentFixture<EditTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTextComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTextComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
