import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MenuItem } from "../core/ui/navigation/menu-item";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { AdminIconComponent } from "../admin-icon-input/admin-icon-input.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatIconButton } from "@angular/material/button";

@Component({
  selector: "app-menu-item-form",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    AdminIconComponent,
    FaIconComponent,
    MatTooltipModule,
    MatSelectModule,
    MatIconButton,
  ],
  templateUrl: "./menu-item-form.component.html",
  styleUrls: ["./menu-item-form.component.scss"],
})
export class MenuItemFormComponent implements OnInit {
  @Input() item!: MenuItem;

  /**
   * Available routes that are offered to the user for selection.
   */
  @Input() linkOptions: { value: string; label: string }[] = [];
  @Output() itemChange = new EventEmitter<MenuItem>();

  /**
  * If true: show free-text input. If false: show dropdown with linkOptions.
  */
  customLinkMode = false;

  ngOnInit() {
    // If no options are available, always start in custom link mode
    if (!this.linkOptions || this.linkOptions.length === 0) {
      this.customLinkMode = true;
    }
  }

  onChange() {
    this.itemChange.emit({ ...this.item });
  }

  toggleCustomLinkMode() {
    this.customLinkMode = !this.customLinkMode;
  }
}
