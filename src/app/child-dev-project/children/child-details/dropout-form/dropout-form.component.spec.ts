import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DropoutFormComponent } from "./dropout-form.component";

describe("DropoutFormComponent", () => {
  let component: DropoutFormComponent;
  let fixture: ComponentFixture<DropoutFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DropoutFormComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropoutFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
