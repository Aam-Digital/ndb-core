import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "../language.service";
import { ConfigurableEnumService } from "../../basic-datatypes/configurable-enum/configurable-enum.service";
import { availableLocales } from "../languages";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("LanguageSelectComponent", () => {
  let component: LanguageSelectComponent;
  let fixture: ComponentFixture<LanguageSelectComponent>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;

  beforeEach(async () => {
    mockLocation = jasmine.createSpyObj("Location", ["reload"]);
    mockLanguageService = jasmine.createSpyObj("LanguageService", [
      "getCurrentLocale",
      "initDefaultLanguage",
      "switchLocale",
    ]);
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

  it("should write selected language to local storage and reload page", () => {
    component.changeLocale("de");
    expect(mockLanguageService.switchLocale).toHaveBeenCalledWith("de");
  });
});
