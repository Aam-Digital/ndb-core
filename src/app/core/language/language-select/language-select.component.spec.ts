import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "../language.service";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { availableLocales } from "../languages";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import type { Mock } from "vitest";
import { UnsavedChangesService } from "../../entity-details/form/unsaved-changes.service";

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
  let mockUnsavedChanges: { checkUnsavedChanges: Mock };

  beforeEach(async () => {
    mockLanguageService = {
      getCurrentLocale: vi.fn().mockName("LanguageService.getCurrentLocale"),
      initDefaultLanguage: vi
        .fn()
        .mockName("LanguageService.initDefaultLanguage"),
      switchLocale: vi.fn().mockName("LanguageService.switchLocale"),
    };
    mockUnsavedChanges = {
      checkUnsavedChanges: vi.fn().mockResolvedValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [
        LanguageSelectComponent,
        RouterTestingModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: UnsavedChangesService, useValue: mockUnsavedChanges },
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

  it("should switch locale", async () => {
    await component.changeLocale("de");
    expect(mockLanguageService.switchLocale).toHaveBeenCalledWith("de");
  });

  it("should not switch locale when unsaved changes are not discarded", async () => {
    mockUnsavedChanges.checkUnsavedChanges.mockResolvedValue(false);
    component.currentLocale.set("en-US");

    await component.changeLocale("de");

    // switching reloads the page, which would discard what the user typed
    expect(mockLanguageService.switchLocale).not.toHaveBeenCalled();
    expect(component.currentLocale()).toBe("en-US");
  });
});
