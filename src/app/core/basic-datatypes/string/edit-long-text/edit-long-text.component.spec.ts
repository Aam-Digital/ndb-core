import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupCustomFormControlEditComponent } from "../../../entity/entity-field-edit/dynamic-edit/edit-component-test-utils";
import { EditLongTextComponent } from "./edit-long-text.component";

describe("EditLongTextComponent", () => {
  let component: EditLongTextComponent;
  let fixture: ComponentFixture<EditLongTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLongTextComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditLongTextComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
