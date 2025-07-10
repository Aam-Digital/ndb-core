import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminMatchingEntitiesComponent } from "./admin-matching-entities.component";

describe("AdminMatchingEntitiesComponent", () => {
  let component: AdminMatchingEntitiesComponent;
  let fixture: ComponentFixture<AdminMatchingEntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMatchingEntitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMatchingEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
