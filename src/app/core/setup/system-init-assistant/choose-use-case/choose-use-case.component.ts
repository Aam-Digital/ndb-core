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
import { MarkdownComponent } from "ngx-markdown";
import { FormsModule } from "@angular/forms";
import { LanguageService } from "app/core/language/language.service";

export interface UseCaseOption {
  config: BaseConfig;
  name: string;
  description: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-choose-use-case",
  templateUrl: "./choose-use-case.component.html",
  imports: [MatSelectModule, MatCheckboxModule, MarkdownComponent, FormsModule],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  private readonly languageService = inject(LanguageService);

  useCases: InputSignal<BaseConfig[]> = input([]);

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

  /**
   * Falls back to offering every use case rather than switching the user's language
   * for them - they came here in the language they want to work in. The ones from
   * another language are greyed out, so the mismatch is visible rather than silent.
   */
  availableUseCases: Signal<UseCaseOption[]> = computed(() => {
    const offered = this.offeredInCurrentLocale();
    return this.scenarios()
      .filter((uc) => offered.has(uc) || this.hasNoUseCaseInCurrentLocale())
      .map((config) => this.toOption(config));
  });

  startFromScratchUseCase: Signal<UseCaseOption | undefined> = computed(() => {
    const config = this.useCases().find((uc) => uc.startFromScratch);
    return config ? this.toOption(config) : undefined;
  });

  private toOption(config: BaseConfig): UseCaseOption {
    return {
      config,
      name: resolveLocaleText(config.name) ?? "",
      description: resolveLocaleText(config.description) ?? "",
    };
  }

  selectionChanged = output<BaseConfig | null>();

  selectedUseCase: UseCaseOption;
  startFromScratch = signal(false);

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase.config);
  }

  /**
   * Starting from scratch is an alternative to picking a scenario, not one of them,
   * so it replaces the dropdown's selection while it is ticked.
   */
  onStartFromScratchChange(checked: boolean) {
    this.startFromScratch.set(checked);
    this.selectionChanged.emit(
      checked
        ? (this.startFromScratchUseCase()?.config ?? null)
        : (this.selectedUseCase?.config ?? null),
    );
  }
}
