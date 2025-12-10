import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MenuItem } from "../../../ui/navigation/menu-item";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatIconButton } from "@angular/material/button";
import { IconComponent } from "#src/app/core/common-components/icon-input/icon-input.component";

@Component({
  selector: "app-menu-item-form",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    IconComponent,
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
  @Input() hideLabel = false;
  @Input() hideLink = false;

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
      return;
    }

    // If there's a link value but it's not in the available options, switch to custom mode
    if (this.item?.link && !this.isLinkInOptions(this.item.link)) {
      this.customLinkMode = true;
    }
  }

  private isLinkInOptions(link: string): boolean {
    return this.linkOptions?.some((option) => option.value === link) ?? false;
  }

  onChange() {
    this.itemChange.emit({ ...this.item });
  }

  toggleCustomLinkMode() {
    this.customLinkMode = !this.customLinkMode;
  }
}
