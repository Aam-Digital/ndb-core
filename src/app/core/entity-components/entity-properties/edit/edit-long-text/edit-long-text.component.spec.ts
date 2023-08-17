import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditLongTextComponent } from "./edit-long-text.component";
import { setupEditComponent } from "../edit-component.spec";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("EditLongTextComponent", () => {
  let component: EditLongTextComponent;
  let fixture: ComponentFixture<EditLongTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLongTextComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLongTextComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
