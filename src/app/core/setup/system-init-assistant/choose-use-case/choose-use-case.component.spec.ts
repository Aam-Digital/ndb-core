import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChooseUseCaseComponent } from "./choose-use-case.component";
import { WINDOW_TOKEN } from "../../../../utils/di-tokens";

describe("ChooseUseCaseComponent", () => {
  let component: ChooseUseCaseComponent;
  let fixture: ComponentFixture<ChooseUseCaseComponent>;

  beforeEach(async () => {
    const mockWindow: Partial<Window> = {
      localStorage: window.localStorage,
    };
    await TestBed.configureTestingModule({
      imports: [ChooseUseCaseComponent],
      providers: [{ provide: WINDOW_TOKEN, useValue: mockWindow }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseUseCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
