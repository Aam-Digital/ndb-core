import { Component, Input, Output, EventEmitter, Inject } from "@angular/core";
import { BaseConfig } from "../base-config";
import { MatSelectModule } from "@angular/material/select";
import { WINDOW_TOKEN } from "app/utils/di-tokens";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "app/core/language/language-statics";

@Component({
  selector: "app-choose-use-case",
  templateUrl: "./choose-use-case.component.html",
  imports: [MatSelectModule],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  private _demoUseCases: BaseConfig[] = [];

  @Input()
  set demoUseCases(useCases: BaseConfig[]) {
    this._demoUseCases = useCases || [];
    this.sortedUseCases = this._demoUseCases.sort((a, b) => {
      if (a.locale === this.locale && b.locale !== this.locale) return -1;
      if (a.locale !== this.locale && b.locale === this.locale) return 1;
      return 0;
    });
  }

  get demoUseCases(): BaseConfig[] {
    return this._demoUseCases;
  }

  sortedUseCases: BaseConfig[] = [];

  @Output() selectionChanged = new EventEmitter<BaseConfig>();

  selectedUseCase: BaseConfig;
  locale: string;

  constructor(@Inject(WINDOW_TOKEN) private window: Window) {
    this.locale =
      this.window.localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ||
      DEFAULT_LANGUAGE;
  }

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase);
  }
}
