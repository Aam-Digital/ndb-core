import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityArrayComponent } from "./edit-entity-array.component";

describe("EditEntityArrayComponent", () => {
  let component: EditEntityArrayComponent;
  let fixture: ComponentFixture<EditEntityArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditEntityArrayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntityArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
