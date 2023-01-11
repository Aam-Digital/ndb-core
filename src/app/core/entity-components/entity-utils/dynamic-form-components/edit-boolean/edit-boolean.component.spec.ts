import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditBooleanComponent } from "./edit-boolean.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupEditComponent } from "../edit-component.spec";

describe("EditBooleanComponent", () => {
  let component: EditBooleanComponent;
  let fixture: ComponentFixture<EditBooleanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBooleanComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditBooleanComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
