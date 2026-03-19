import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "../language.service";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { availableLocales } from "../languages";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import type { Mock } from "vitest";

type LanguageServiceMock = Pick<
  LanguageService,
  "getCurrentLocale" | "initDefaultLanguage" | "switchLocale"
> & {
  getCurrentLocale: Mock;
  initDefaultLanguage: Mock;
  switchLocale: Mock;
};

describe("LanguageSelectComponent", () => {
  let component: LanguageSelectComponent;
  let fixture: ComponentFixture<LanguageSelectComponent>;
  let mockLanguageService: LanguageServiceMock;

  beforeEach(async () => {
    mockLanguageService = {
      getCurrentLocale: vi.fn().mockName("LanguageService.getCurrentLocale"),
      initDefaultLanguage: vi
        .fn()
        .mockName("LanguageService.initDefaultLanguage"),
      switchLocale: vi.fn().mockName("LanguageService.switchLocale"),
    };
    await TestBed.configureTestingModule({
      imports: [
        LanguageSelectComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: LanguageService, useValue: mockLanguageService },
        {
          provide: ConfigurableEnumService,
          useValue: { getEnumValues: () => availableLocales.values },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should switch locale", () => {
    component.changeLocale("de");
    expect(mockLanguageService.switchLocale).toHaveBeenCalledWith("de");
  });
});
