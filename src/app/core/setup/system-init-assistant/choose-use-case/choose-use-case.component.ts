import {
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  output,
  Signal,
} from "@angular/core";
import { BaseConfig } from "../../base-config";
import { MatSelectModule } from "@angular/material/select";
import { MarkdownComponent } from "ngx-markdown";
import { FormsModule } from "@angular/forms";
import { LanguageService } from "app/core/language/language.service";

@Component({
  selector: "app-choose-use-case",
  templateUrl: "./choose-use-case.component.html",
  imports: [MatSelectModule, MarkdownComponent, FormsModule],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  private languageService = inject(LanguageService);

  useCases: InputSignal<BaseConfig[]> = input([]);

  availableUseCases: Signal<BaseConfig[]> = computed(() =>
    this.useCases()?.filter(
      (useCase) => useCase.locale === this.languageService.getCurrentLocale(),
    ),
  );

  private switchLanguageIfNoUseCaseInCurrentLocale = effect(() => {
    if (this.availableUseCases().length === 0 && this.useCases().length > 0) {
      this.languageService.switchLocale(this.useCases()[0].locale);
    }
  });

  selectionChanged = output<BaseConfig>();

  selectedUseCase: BaseConfig;

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase);
  }
}
