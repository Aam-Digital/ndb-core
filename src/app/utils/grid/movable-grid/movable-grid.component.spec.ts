import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MovableGridComponent } from "./movable-grid.component";

describe("MovableGridComponent", () => {
  let component: MovableGridComponent;
  let fixture: ComponentFixture<MovableGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MovableGridComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MovableGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
