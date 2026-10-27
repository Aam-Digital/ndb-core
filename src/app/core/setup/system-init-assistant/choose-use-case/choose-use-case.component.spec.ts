import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChooseUseCaseComponent } from "./choose-use-case.component";
import { LanguageService } from "app/core/language/language.service";
import { BaseConfig } from "../../base-config";

describe("ChooseUseCaseComponent", () => {
  let component: ChooseUseCaseComponent;
  let fixture: ComponentFixture<ChooseUseCaseComponent>;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockLanguageService = {
      getCurrentLocale: vi.fn().mockName("LanguageService.getCurrentLocale"),
      switchLocale: vi.fn().mockName("LanguageService.switchLocale"),
    };
    mockLanguageService.getCurrentLocale.mockReturnValue("en");

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

  describe("availableUseCases", () => {
    /** only the two fields these tests care about */
    const useCase = (name: string, locale?: string) =>
      ({ name, locale }) as unknown as BaseConfig;

    function given(locale: string, useCases: BaseConfig[]) {
      mockLanguageService.getCurrentLocale.mockReturnValue(locale);
      fixture.componentRef.setInput("useCases", useCases);
      fixture.detectChanges();
    }

    const names = () => component.availableUseCases().map((uc) => uc.name);

    it("should offer the use cases in the current language, and those without one", () => {
      given("en", [
        useCase("English", "en"),
        useCase("German", "de"),
        useCase("Start from scratch"),
      ]);

      expect(names()).toEqual(["English", "Start from scratch"]);
      expect(component.hasNoUseCaseInCurrentLocale()).toBe(false);
    });

    it("should offer every use case when none is written in the current language", () => {
      given("ar", [
        useCase("French", "fr"),
        useCase("German", "de"),
        useCase("Start from scratch"),
      ]);

      expect(names()).toEqual(["French", "German", "Start from scratch"]);
      expect(component.hasNoUseCaseInCurrentLocale()).toBe(true);
    });

    it("should offer the use cases of other languages only once asked for", () => {
      given("en", [useCase("English", "en"), useCase("German", "de")]);

      expect(names()).toEqual(["English"]);
      expect(component.hasUseCasesInOtherLanguages()).toBe(true);

      component.onShowOtherLanguagesChange(true);

      expect(names()).toEqual(["English", "German"]);
    });

    it("should drop a use case of another language when hiding them again", () => {
      const emitted: (BaseConfig | null)[] = [];
      component.selectionChanged.subscribe((c) => emitted.push(c));
      given("en", [useCase("English", "en"), useCase("German", "de")]);
      component.onShowOtherLanguagesChange(true);
      component.selectedUseCase.set(
        component.availableUseCases().find((uc) => uc.name === "German"),
      );

      component.onShowOtherLanguagesChange(false);

      // no longer offered, so leaving it selected would show a blank dropdown
      expect(component.selectedUseCase()).toBeUndefined();
      expect(emitted).toEqual([null]);
    });

    it("should clear the selection when starting from scratch", () => {
      given("en", [useCase("English", "en")]);
      component.selectedUseCase.set(component.availableUseCases()[0]);

      component.onStartFromScratchChange(true);

      expect(component.selectedUseCase()).toBeUndefined();
    });

    it("should fix the toggle on when nothing matches the current language", () => {
      given("ar", [useCase("French", "fr"), useCase("German", "de")]);

      // shown and on, so the greyed-out options are explained rather than unexplained
      expect(component.hasUseCasesInOtherLanguages()).toBe(true);
      expect(component.revealOtherLanguages()).toBe(true);
      expect(component.hasNoUseCaseInCurrentLocale()).toBe(true);
    });

    it("should still match the selection after the option list is rebuilt", () => {
      given("en", [useCase("English", "en"), useCase("German", "de")]);
      const picked = component.availableUseCases()[0];

      component.onShowOtherLanguagesChange(true);
      const rebuilt = component
        .availableUseCases()
        .find((o) => o.name === picked.name);

      expect(rebuilt).not.toBe(picked);
      expect(component.compareUseCases(picked, rebuilt)).toBe(true);
    });

    it("should never switch the language on the user's behalf", () => {
      given("ar", [useCase("French", "fr"), useCase("German", "de")]);

      expect(mockLanguageService.switchLocale).not.toHaveBeenCalled();
    });
  });
});
