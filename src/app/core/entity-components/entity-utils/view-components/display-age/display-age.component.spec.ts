import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayAgeComponent } from "./display-age.component";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { DateOfBirth } from "../../../../../child-dev-project/children/model/dateOfBirth";
import moment from "moment";

describe("DisplayAgeComponent", () => {
  let component: DisplayAgeComponent;
  let fixture: ComponentFixture<DisplayAgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DisplayAgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayAgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should take the date object of the parent entity", () => {
    const child = new Child();
    child.dateOfBirth = new DateOfBirth(moment().subtract(5, "years").toDate());

    component.onInitFromDynamicConfig({
      entity: child,
      config: "dateOfBirth",
      id: "age",
      value: undefined,
    });

    expect(component.date).toBe(child.dateOfBirth);
    expect(component.date.age).toBe(5);
  });
});
