import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActiveStudentsComponent } from "./active-students.component";

describe("ActiveStudentsComponent", () => {
  let component: ActiveStudentsComponent;
  let fixture: ComponentFixture<ActiveStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveStudentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveStudentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
