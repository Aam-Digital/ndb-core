import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayCheckmarkComponent } from "./display-checkmark.component";

describe("DisplayCheckmarkComponent", () => {
  let component: DisplayCheckmarkComponent;
  let fixture: ComponentFixture<DisplayCheckmarkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayCheckmarkComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayCheckmarkComponent);
    component = fixture.componentInstance;
    component.value = true;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
