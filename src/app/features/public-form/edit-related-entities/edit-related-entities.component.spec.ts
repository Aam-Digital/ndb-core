import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditRelatedEntitiesComponent } from "./edit-related-entities.component";

describe("EditRelatedEntitiesComponent", () => {
  let component: EditRelatedEntitiesComponent;
  let fixture: ComponentFixture<EditRelatedEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditRelatedEntitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditRelatedEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
