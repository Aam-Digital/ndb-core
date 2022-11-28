import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntitySummaryComponent } from "./entity-summary.component";

xdescribe("EntitySummaryComponent", () => {
  let component: EntitySummaryComponent;
  let fixture: ComponentFixture<EntitySummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntitySummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
