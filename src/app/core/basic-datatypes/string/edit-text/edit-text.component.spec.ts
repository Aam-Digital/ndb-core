import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTextComponent } from "./edit-text.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { setupEditComponent } from "../../../entity/default-datatype/edit-component.spec";

describe("EditTextComponent", () => {
  let component: EditTextComponent;
  let fixture: ComponentFixture<EditTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTextComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTextComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
