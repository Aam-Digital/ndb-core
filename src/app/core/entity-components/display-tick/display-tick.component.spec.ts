import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayTickComponent } from "./display-tick.component";

describe("DisplayTickComponent", () => {
  let component: DisplayTickComponent;
  let fixture: ComponentFixture<DisplayTickComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayTickComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
