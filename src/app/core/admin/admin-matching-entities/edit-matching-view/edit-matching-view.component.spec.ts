import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditMatchingViewComponent } from "./edit-matching-view.component";

describe("EditMatchingViewComponent", () => {
  let component: EditMatchingViewComponent;
  let fixture: ComponentFixture<EditMatchingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMatchingViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditMatchingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
