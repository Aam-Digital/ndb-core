import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormComponent } from "./form.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

describe("FormComponent", () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormComponent],
      imports: [RouterTestingModule],
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

  it("calls router once a new child is saved", async () => {
    const testChild = new Child();
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, "navigate");
    component.creatingNew = true;
    await component.saveClicked(testChild);
    expect(router.navigate).toHaveBeenCalledWith(["", testChild.getId()]);
  });
});
