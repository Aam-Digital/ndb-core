import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDescriptionOnlyComponent } from "./edit-description-only.component";
import { setupEditComponent } from "../edit-component.spec";

describe("EditDescriptionOnlyComponent", () => {
  let component: EditDescriptionOnlyComponent;
  let fixture: ComponentFixture<EditDescriptionOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDescriptionOnlyComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDescriptionOnlyComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
