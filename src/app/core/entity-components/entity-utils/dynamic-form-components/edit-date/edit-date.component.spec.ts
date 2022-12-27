import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDateComponent } from "./edit-date.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatNativeDateModule } from "@angular/material/core";
import { setupEditComponent } from "../edit-component.spec";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule,
      ],
      declarations: [EditDateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
