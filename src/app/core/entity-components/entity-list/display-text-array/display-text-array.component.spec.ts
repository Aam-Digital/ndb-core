import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayTextArrayComponent } from "./display-text-array.component";

describe("DisplayTextArrayComponent", () => {
  let component: DisplayTextArrayComponent;
  let fixture: ComponentFixture<DisplayTextArrayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayTextArrayComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTextArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
