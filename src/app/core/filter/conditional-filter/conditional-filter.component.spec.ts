import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConditionalFilterComponent } from "./conditional-filter.component";

describe("ConditionalFilterComponent", () => {
  let component: ConditionalFilterComponent;
  let fixture: ComponentFixture<ConditionalFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionalFilterComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
