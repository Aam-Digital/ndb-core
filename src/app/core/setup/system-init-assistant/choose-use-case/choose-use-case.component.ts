import { Component, EventEmitter, Input, Output } from "@angular/core";
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
  private _demoUseCases: BaseConfig[] = [];

  @Input()
  set demoUseCases(useCases: BaseConfig[]) {
    this._demoUseCases = useCases?.filter(
      (useCase) => useCase.locale === this.locale,
    );
  }

  get demoUseCases(): BaseConfig[] {
    return this._demoUseCases;
  }

  @Output() selectionChanged = new EventEmitter<BaseConfig>();

  selectedUseCase: BaseConfig;
  locale: string;

  constructor(private languageService: LanguageService) {
    this.locale = this.languageService.getCurrentLocale();
  }

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase);
  }
}
