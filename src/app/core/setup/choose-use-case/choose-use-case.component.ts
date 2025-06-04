import { Component, Input, Output, EventEmitter } from "@angular/core";
import { BaseConfig } from "../base-config";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-choose-use-case",
  templateUrl: "./choose-use-case.component.html",
  imports: [MatSelectModule],
  styleUrls: ["./choose-use-case.component.scss"],
})
export class ChooseUseCaseComponent {
  @Input() demoUseCases: BaseConfig[] = [];
  @Output() selectionChanged = new EventEmitter<BaseConfig>();

  selectedUseCase: BaseConfig;

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedUseCase);
  }
}
