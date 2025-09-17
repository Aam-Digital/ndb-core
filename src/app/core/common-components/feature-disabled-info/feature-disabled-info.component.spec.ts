import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FeatureDisabledInfoComponent } from "./feature-disabled-info.component";
import { NAVIGATOR_TOKEN } from "#src/app/utils/di-tokens";

describe("FeatureDisabledInfoComponent", () => {
  let component: FeatureDisabledInfoComponent;
  let fixture: ComponentFixture<FeatureDisabledInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureDisabledInfoComponent],
      providers: [{ provide: NAVIGATOR_TOKEN, useValue: { onLine: true } }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureDisabledInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
