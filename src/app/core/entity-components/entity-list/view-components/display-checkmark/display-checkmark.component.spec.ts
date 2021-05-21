import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayCheckmarkComponent } from "./display-checkmark.component";
import { School } from "../../../../../child-dev-project/schools/model/school";

describe("DisplayCheckmarkComponent", () => {
  let component: DisplayCheckmarkComponent;
  let fixture: ComponentFixture<DisplayCheckmarkComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DisplayCheckmarkComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayCheckmarkComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({
      entity: new School(),
      id: "privateSchool",
    });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
