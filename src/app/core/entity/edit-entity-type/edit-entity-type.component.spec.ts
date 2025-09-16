import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityTypeComponent } from "./edit-entity-type.component";
import { setupCustomFormControlEditComponent } from "../default-datatype/edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditEntityTypeComponent", () => {
  let component: EditEntityTypeComponent;
  let fixture: ComponentFixture<EditEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEntityTypeComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditEntityTypeComponent);
    component = fixture.componentInstance;
    setupCustomFormControlEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
