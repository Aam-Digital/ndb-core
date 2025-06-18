import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChooseUseCaseComponent } from "./choose-use-case.component";
import { LanguageService } from "app/core/language/language.service";

describe("ChooseUseCaseComponent", () => {
  let component: ChooseUseCaseComponent;
  let fixture: ComponentFixture<ChooseUseCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseUseCaseComponent],
      providers: [
        {
          provide: LanguageService,
          useValue: jasmine.createSpyObj(["getCurrentLocale"]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseUseCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
