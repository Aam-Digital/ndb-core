import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPercentageComponent } from "./edit-percentage.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormControl } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditPercentageComponent", () => {
  let component: EditPercentageComponent;
  let fixture: ComponentFixture<EditPercentageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatFormFieldModule, MatInputModule, NoopAnimationsModule],
      declarations: [EditPercentageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPercentageComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
