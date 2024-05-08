import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BetaFeatureComponent } from "./beta-feature.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("BetaFeatureComponent", () => {
  let component: BetaFeatureComponent;
  let fixture: ComponentFixture<BetaFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BetaFeatureComponent, FontAwesomeTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BetaFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
