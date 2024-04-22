import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-anonymize-options",
  standalone: true,
  imports: [CommonModule, MatOptionModule, MatSelectModule, MatTooltipModule],
  templateUrl: "./anonymize-options.component.html",
  styleUrl: "./anonymize-options.component.scss",
})
export class AnonymizeOptionsComponent {
  @Input() anonymizeData: any;
  @Output() valueChange = new EventEmitter<string>();

  ngOnInit(): void {
    if (!this.anonymizeData.anonymize) {
      this.anonymizeData.anonymize = "";
    }
  }
  onValueChange(event: MatSelectChange) {
    console.log(this.anonymizeData, "datata");
    this.valueChange.emit(event.value);
  }
}
interface AnonymizeData {
  anonymize: string;
}
