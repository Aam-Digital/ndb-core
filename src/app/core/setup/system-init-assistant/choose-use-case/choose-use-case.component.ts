import {
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  output,
  Signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { BaseConfig, isOfferedInLocale } from "../../base-config";
import { resolveLocaleText } from "app/core/language/active-locale";
import { asArray } from "app/utils/asArray";
import { MatSelectModule } from "@angular/material/select";
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
  imports: [MatSelectModule, MarkdownComponent, FormsModule],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  private readonly languageService = inject(LanguageService);

  useCases: InputSignal<BaseConfig[]> = input([]);

  availableUseCases: Signal<UseCaseOption[]> = computed(() => {
    const current = this.languageService.getCurrentLocale();
    return this.useCases()
      .filter((uc) => isOfferedInLocale(uc, current))
      .map((config) => ({
        config,
        name: resolveLocaleText(config.name) ?? "",
        description: resolveLocaleText(config.description) ?? "",
      }));
  });

  private readonly switchLanguageIfNoUseCaseInCurrentLocale = effect(() => {
    if (this.availableUseCases().length === 0 && this.useCases().length > 0) {
      const nextLanguage = this.useCases()
        .flatMap((uc) => (uc.locale ? asArray(uc.locale) : []))
        .find(Boolean);
      if (nextLanguage) this.languageService.switchLocale(nextLanguage);
    }
  });

  selectionChanged = output<BaseConfig>();

  selectedUseCase: UseCaseOption;

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase.config);
  }
}
