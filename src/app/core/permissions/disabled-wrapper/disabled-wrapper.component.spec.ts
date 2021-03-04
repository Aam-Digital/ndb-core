import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DisabledWrapperComponent } from "./disabled-wrapper.component";

describe("DisabledWrapperComponent", () => {
  let component: DisabledWrapperComponent;
  let fixture: ComponentFixture<DisabledWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DisabledWrapperComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisabledWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
