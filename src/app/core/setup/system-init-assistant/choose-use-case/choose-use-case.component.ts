import {
  Component,
  computed,
  inject,
  input,
  InputSignal,
  output,
  signal,
  Signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { BaseConfig, isOfferedInLocale } from "../../base-config";
import { resolveLocaleText } from "app/core/language/active-locale";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MarkdownComponent } from "ngx-markdown";
import { LanguageService } from "app/core/language/language.service";
import { asArray } from "app/utils/asArray";

export interface UseCaseOption {
  config: BaseConfig;
  name: string;
  description: string;
  offered?: boolean;
  languages?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-choose-use-case",
  templateUrl: "./choose-use-case.component.html",
  imports: [
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MarkdownComponent,
  ],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  private readonly languageService = inject(LanguageService);

  useCases: InputSignal<BaseConfig[]> = input([]);

  selectionChanged = output<BaseConfig | null>();

  selectedUseCase = signal<UseCaseOption | undefined>(undefined);
  startFromScratch = signal(false);
  showOtherLanguages = signal(false);

  readonly startFromScratchHint = $localize`:Setup wizard - start from scratch tooltip:Set up a system without any predefined record types and define your own from the admin screens.`;
  readonly emptySystemPlaceholder = $localize`:Setup wizard - use case placeholder while starting from scratch:empty system`;
  readonly otherLanguageHint = $localize`:Setup wizard - tooltip on a use case that is not in the user's language:This use case is not available in your language. Its texts come in the language shown.`;

  private readonly scenarios = computed(() =>
    this.useCases().filter((uc) => !uc.startFromScratch),
  );

  private readonly localisedUseCases = computed(() =>
    this.scenarios().filter((uc) => !!uc.locale),
  );

  /** Precomputed, so the template does not re-check every option on each cycle. */
  offeredInCurrentLocale: Signal<Set<BaseConfig>> = computed(() => {
    const locale = this.languageService.getCurrentLocale();
    return new Set(
      this.scenarios().filter((uc) => isOfferedInLocale(uc, locale)),
    );
  });

  /** True while use cases exist for other languages but none for the user's own. */
  hasNoUseCaseInCurrentLocale: Signal<boolean> = computed(() => {
    const localised = this.localisedUseCases();
    const offered = this.offeredInCurrentLocale();
    return localised.length > 0 && !localised.some((uc) => offered.has(uc));
  });

  hasUseCasesInOtherLanguages: Signal<boolean> = computed(() => {
    const offered = this.offeredInCurrentLocale();
    return this.scenarios().some((uc) => !offered.has(uc));
  });

  /** Fixed on with nothing in the user's language, to explain the greyed-out options. */
  revealOtherLanguages: Signal<boolean> = computed(
    () => this.showOtherLanguages() || this.hasNoUseCaseInCurrentLocale(),
  );

  /**
   * Use cases of another language are greyed out rather than switching the user's
   * language for them - they came here in the language they want to work in.
   */
  availableUseCases: Signal<UseCaseOption[]> = computed(() => {
    const offered = this.offeredInCurrentLocale();
    const showAll = this.revealOtherLanguages();
    const languageName = this.languageNamer();
    return (
      this.scenarios()
        .filter((uc) => offered.has(uc) || showAll)
        .map((config) => ({
          ...this.toOption(config),
          offered: offered.has(config),
          languages: languageName(config.locale),
        }))
        // a stable sort, so the configured order is kept within each group
        .sort((a, b) => Number(b.offered) - Number(a.offered))
    );
  });

  startFromScratchUseCase: Signal<UseCaseOption | undefined> = computed(() => {
    const config = this.useCases().find((uc) => uc.startFromScratch);
    return config ? this.toOption(config) : undefined;
  });

  /** The option wrappers are rebuilt, so match on the config they wrap. */
  compareUseCases = (a: UseCaseOption, b: UseCaseOption) =>
    a?.config === b?.config;

  onSelectionChange(option: UseCaseOption) {
    this.selectedUseCase.set(option);
    this.selectionChanged.emit(option.config);
  }

  onStartFromScratchChange(checked: boolean) {
    this.startFromScratch.set(checked);
    if (checked) {
      // a pick left in the disabled dropdown would read as if it were still used
      this.selectedUseCase.set(undefined);
    }
    this.selectionChanged.emit(
      checked ? (this.startFromScratchUseCase()?.config ?? null) : null,
    );
  }

  onShowOtherLanguagesChange(checked: boolean) {
    this.showOtherLanguages.set(checked);
    const selected = this.selectedUseCase()?.config;
    if (!checked && selected && !this.offeredInCurrentLocale().has(selected)) {
      // no longer in the list, so the dropdown would show a blank selection
      this.selectedUseCase.set(undefined);
      this.selectionChanged.emit(null);
    }
  }

  /** Names the languages of a use case in the user's own language, e.g. "German, French". */
  private languageNamer(): (locale: BaseConfig["locale"]) => string {
    const names = new Intl.DisplayNames(
      [this.languageService.getCurrentLocale()],
      { type: "language", fallback: "code" },
    );
    return (locale) =>
      locale
        ? asArray(locale)
            .map((l) => names.of(l) ?? l)
            .join(", ")
        : "";
  }

  private toOption(config: BaseConfig): UseCaseOption {
    return {
      config,
      name: resolveLocaleText(config.name) ?? "",
      description: resolveLocaleText(config.description) ?? "",
    };
  }
}
