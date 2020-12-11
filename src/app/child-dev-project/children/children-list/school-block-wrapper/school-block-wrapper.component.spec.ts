import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SchoolBlockWrapperComponent } from "./school-block-wrapper.component";

describe("SchoolBlockWrapperComponent", () => {
  let component: SchoolBlockWrapperComponent;
  let fixture: ComponentFixture<SchoolBlockWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SchoolBlockWrapperComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolBlockWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
