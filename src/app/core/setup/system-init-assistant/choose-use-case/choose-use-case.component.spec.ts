import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChooseUseCaseComponent } from "./choose-use-case.component";
import { LanguageService } from "app/core/language/language.service";
import { BaseConfig } from "../../base-config";

describe("ChooseUseCaseComponent", () => {
  let component: ChooseUseCaseComponent;
  let fixture: ComponentFixture<ChooseUseCaseComponent>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockLanguageService = jasmine.createSpyObj("LanguageService", [
      "getCurrentLocale",
      "switchLocale",
    ]);
    mockLanguageService.getCurrentLocale.and.returnValue("en");

    await TestBed.configureTestingModule({
      imports: [ChooseUseCaseComponent],
      providers: [
        {
          provide: LanguageService,
          useValue: mockLanguageService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChooseUseCaseComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe("switchLanguageIfNoUseCaseInCurrentLocale effect", () => {
    it("should switch locale when no use cases available in current locale but available in other locale", () => {
      // Arrange
      const useCasesInDifferentLocales: BaseConfig[] = [
        { locale: "fr", label: "French 1" } as unknown as BaseConfig,
        { locale: "de", label: "German 1" } as unknown as BaseConfig,
      ];
      mockLanguageService.getCurrentLocale.and.returnValue("en");

      // Act
      fixture.componentRef.setInput("useCases", useCasesInDifferentLocales);
      fixture.detectChanges();

      // Assert
      expect(mockLanguageService.switchLocale).toHaveBeenCalledWith("fr");
    });

    it("should not switch locale when use cases are available in current locale", () => {
      // Arrange
      const useCasesInCurrentLocale: BaseConfig[] = [
        { locale: "en", label: "English 1" } as unknown as BaseConfig,
        { locale: "de", label: "German 1" } as unknown as BaseConfig,
      ];
      mockLanguageService.getCurrentLocale.and.returnValue("en");

      // Act
      fixture.componentRef.setInput("useCases", useCasesInCurrentLocale);
      fixture.detectChanges();

      // Assert
      expect(mockLanguageService.switchLocale).not.toHaveBeenCalled();
    });

    it("should not switch locale when there are no use cases at all", () => {
      // Arrange
      const emptyUseCases: BaseConfig[] = [];
      mockLanguageService.getCurrentLocale.and.returnValue("en");

      // Act
      fixture.componentRef.setInput("useCases", emptyUseCases);
      fixture.detectChanges();

      // Assert
      expect(mockLanguageService.switchLocale).not.toHaveBeenCalled();
    });
  });
});
