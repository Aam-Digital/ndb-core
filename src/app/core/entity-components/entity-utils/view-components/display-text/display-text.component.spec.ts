import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayTextComponent } from "./display-text.component";

describe("DisplayTextComponent", () => {
  let component: DisplayTextComponent;
  let fixture: ComponentFixture<DisplayTextComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayTextComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTextComponent);
    component = fixture.componentInstance;
    component.value = "text";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
