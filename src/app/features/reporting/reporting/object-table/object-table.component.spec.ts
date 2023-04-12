import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ObjectTableComponent } from "./object-table.component";

describe("ObjectTableComponent", () => {
  let component: ObjectTableComponent;
  let fixture: ComponentFixture<ObjectTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should setup a table with columns for each property of the input data", () => {
    component.objects = [
      { first: 1, second: 3 },
      { first: 2, second: 1 },
    ];

    component.ngOnInit();

    expect(component.columns).toEqual(["first", "second"]);
  });
});
