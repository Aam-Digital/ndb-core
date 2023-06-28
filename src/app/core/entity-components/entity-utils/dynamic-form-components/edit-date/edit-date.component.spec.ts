import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDateComponent } from "./edit-date.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupEditComponent } from "../edit-component.spec";
import { MatNativeDateModule } from "@angular/material/core";

describe("EditDateComponent", () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDateComponent, NoopAnimationsModule, MatNativeDateModule],
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
