import {
  Component,
  computed,
  inject,
  input,
  InputSignal,
  output,
  Signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { BaseConfig, isOfferedInLocale } from "../../base-config";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MarkdownComponent } from "ngx-markdown";
import { FormsModule } from "@angular/forms";
import { LanguageService } from "app/core/language/language.service";

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

  startFromScratchUseCase: Signal<BaseConfig | undefined> = computed(() =>
    this.useCases().find((uc) => uc.startFromScratch),
  );

  private readonly scenarios = computed(() =>
    this.useCases().filter((uc) => !uc.startFromScratch),
  );

  private readonly localisedUseCases = computed(() =>
    this.scenarios().filter((uc) => !!uc.locale),
  );

  /** True while use cases exist for other languages but none for the user's own. */
  hasNoUseCaseInCurrentLocale: Signal<boolean> = computed(() => {
    const localised = this.localisedUseCases();
    return (
      localised.length > 0 &&
      !localised.some((uc) => this.isOfferedInCurrentLocale(uc))
    );
  });

  /**
   * Falls back to offering every use case rather than switching the user's language
   * for them - they came here in the language they want to work in. The ones from
   * another language are greyed out, so the mismatch is visible rather than silent.
   */
  availableUseCases: Signal<BaseConfig[]> = computed(() =>
    this.scenarios().filter(
      (uc) =>
        this.isOfferedInCurrentLocale(uc) || this.hasNoUseCaseInCurrentLocale(),
    ),
  );

  /** A use case without a locale is offered in every language, so never greyed out. */
  isOfferedInCurrentLocale(useCase: BaseConfig): boolean {
    return isOfferedInLocale(useCase, this.languageService.getCurrentLocale());
  }

  selectionChanged = output<BaseConfig | null>();

  selectedUseCase: BaseConfig;
  startFromScratch = false;

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase);
  }

  /**
   * Starting from scratch is an alternative to picking a scenario, not one of them,
   * so it replaces the dropdown's selection while it is ticked.
   */
  onStartFromScratchChange(checked: boolean) {
    this.startFromScratch = checked;
    this.selectionChanged.emit(
      checked ? this.startFromScratchUseCase() : (this.selectedUseCase ?? null),
    );
  }
}
