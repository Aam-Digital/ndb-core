import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayDateComponent } from "./display-date.component";
import { ChildSchoolRelation } from "../../../../../child-dev-project/children/model/childSchoolRelation";

describe("DisplayDateComponent", () => {
  let component: DisplayDateComponent;
  let fixture: ComponentFixture<DisplayDateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DisplayDateComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayDateComponent);
    component = fixture.componentInstance;
    component.entity = new ChildSchoolRelation();
    component.id = "date";
    component.value = new Date();
    component.config = "dd-MM-yyyy";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
