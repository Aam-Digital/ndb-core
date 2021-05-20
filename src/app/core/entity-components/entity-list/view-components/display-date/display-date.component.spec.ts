import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayDateComponent } from "./display-date.component";

describe("DisplayDateComponent", () => {
  let component: DisplayDateComponent;
  let fixture: ComponentFixture<DisplayDateComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisplayDateComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
