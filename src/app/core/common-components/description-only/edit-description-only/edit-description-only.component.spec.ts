import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditDescriptionOnlyComponent } from "./edit-description-only.component";
import { ComponentRegistry } from "app/dynamic-components";

describe("EditDescriptionOnlyComponent", () => {
  let component: EditDescriptionOnlyComponent;
  let fixture: ComponentFixture<EditDescriptionOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDescriptionOnlyComponent],
      providers: [ComponentRegistry],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDescriptionOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
