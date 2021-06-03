import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormComponent } from "./form.component";
import { Child } from "../../../../child-dev-project/children/model/child";

describe("FormComponent", () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should change the creating state", () => {
    expect(component.creatingNew).toBe(false);

    component.onInitFromDynamicConfig({
      entity: new Child(),
      config: { cols: [] },
      creatingNew: true,
    });

    expect(component.creatingNew).toBe(true);
  });
});
