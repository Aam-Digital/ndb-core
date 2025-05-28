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
  @Input() demoAssistanceItems: BaseConfig[] = [];
  @Output() selectionChanged = new EventEmitter<any>();

  selectedItem: any;

  onSelectionChange() {
    this.selectionChanged.emit(this.selectedItem);
  }
}
