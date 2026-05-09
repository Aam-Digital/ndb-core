import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { DisplayDateComponent } from "./display-date.component";
import { ChildSchoolRelation } from "../../../../child-dev-project/children/model/childSchoolRelation";

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
    fixture.componentRef.setInput("entity", new ChildSchoolRelation());
    fixture.componentRef.setInput("id", "date");
    fixture.componentRef.setInput("value", new Date());
    fixture.componentRef.setInput("config", "dd-MM-yyyy");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
