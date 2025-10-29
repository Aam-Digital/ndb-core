import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdvancedFeaturesComponent } from "./advanced-features.component";

describe("AdvancedFeaturesComponent", () => {
  let component: AdvancedFeaturesComponent;
  let fixture: ComponentFixture<AdvancedFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
