import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WarningNotOptimizedForSmallScreenComponent } from "./warning-not-optimized-for-small-screen.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";

describe("WarningNotOptimizedForSmallScreenComponent", () => {
  let component: WarningNotOptimizedForSmallScreenComponent;
  let fixture: ComponentFixture<WarningNotOptimizedForSmallScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WarningNotOptimizedForSmallScreenComponent,
        MockedTestingModule.withState(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      WarningNotOptimizedForSmallScreenComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
