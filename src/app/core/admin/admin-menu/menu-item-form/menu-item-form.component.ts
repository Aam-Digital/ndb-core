import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MenuItem } from "../../../ui/navigation/menu-item";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormControl, FormsModule } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { MatIconButton } from "@angular/material/button";
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from "@angular/material/slide-toggle";
import { IconComponent } from "#src/app/core/common-components/icon-input/icon-input.component";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatSlideToggleModule,
  ],
  templateUrl: "./menu-item-form.component.html",
  styleUrls: ["./menu-item-form.component.scss"],
})
export class MenuItemFormComponent implements OnInit {
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  @Input() item!: MenuItem;
  @Input() hideLabel = false;
  @Input() hideLink = false;
  @Input() isNew = false;
  @Input() showLinkError = false;

  /**
   * Available routes that are offered to the user for selection.
   */
  @Input() linkOptions: { value: string; label: string }[] = [];
  @Output() itemChange = new EventEmitter<MenuItem>();

  /**
   * If true: show free-text input. If false: show dropdown with linkOptions.
   */
  customLinkMode = false;

  /**
   * Whether this item is intentionally configured as a parent section without a link.
   */
  noLinkMode = false;

  linkErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (_control: FormControl | null): boolean => {
      return this.showLinkError && !this.item?.link?.trim();
    },
  };

  ngOnInit() {
    // For existing manual items with no link, default the toggle to ON.
    if (!this.isNew && !this.item?.link?.trim()) {
      this.noLinkMode = true;
    }

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

  isNoLinkModeEnabled(): boolean {
    return this.noLinkMode;
  }

  async toggleNoLinkMode(event: MatSlideToggleChange) {
    if (event.checked && this.item.link?.trim()) {
      // Warn before removing an existing link.
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Confirmation title for removing link from menu item:Remove link?`,
        $localize`:Confirmation message for removing link from menu item:This item currently has a link. Turning this on will remove it. Do you still want to proceed?`,
      );

      if (!confirmed) {
        event.source.checked = false;
        return;
      }

      delete this.item.link;
      this.onChange();
    }

    this.noLinkMode = event.checked;
  }
}
