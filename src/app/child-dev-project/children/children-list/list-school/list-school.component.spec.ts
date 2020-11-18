import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ListSchoolComponent } from "./list-school.component";

describe("ListSchoolComponent", () => {
  let component: ListSchoolComponent;
  let fixture: ComponentFixture<ListSchoolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ListSchoolComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSchoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
