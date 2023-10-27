import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DisplayAgeComponent } from "./display-age.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import moment from "moment";
import { DateWithAge } from "../dateWithAge";

describe("DisplayAgeComponent", () => {
  let component: DisplayAgeComponent;
  let fixture: ComponentFixture<DisplayAgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayAgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayAgeComponent);
    component = fixture.componentInstance;
    component.entity = new Child();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should take the date object of the parent entity", () => {
    const child = new Child();
    child.dateOfBirth = new DateWithAge(moment().subtract(5, "years").toDate());

    component.entity = child;
    component.config = "dateOfBirth";
    component.id = "age";
    component.ngOnInit();

    expect(component.date).toBe(child.dateOfBirth);
    expect(component.date.age).toBe(5);
  });
});
