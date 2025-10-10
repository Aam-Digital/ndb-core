import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ComponentRegistry } from "app/dynamic-components";
import { DisplayDescriptionOnlyComponent } from "./display-description-only.component";

describe("DisplayDescriptionOnlyComponent", () => {
  let component: DisplayDescriptionOnlyComponent;
  let fixture: ComponentFixture<DisplayDescriptionOnlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayDescriptionOnlyComponent],
      providers: [ComponentRegistry],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDescriptionOnlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
