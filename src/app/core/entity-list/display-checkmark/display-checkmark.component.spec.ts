import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayCheckmarkComponent } from "./display-checkmark.component";

describe("DisplayCheckmarkComponent", () => {
  let component: DisplayCheckmarkComponent;
  let fixture: ComponentFixture<DisplayCheckmarkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayCheckmarkComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayCheckmarkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
