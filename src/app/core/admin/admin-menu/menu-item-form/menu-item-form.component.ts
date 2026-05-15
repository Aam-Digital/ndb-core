import {
  Component,
  inject,
  linkedSignal,
  ChangeDetectionStrategy,
  input,
  model,
  effect,
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
export class MenuItemFormComponent {
  private readonly confirmationDialog = inject(ConfirmationDialogService);

  item = model.required<MenuItem>();
  hideLabel = input<boolean>(false);
  hideLink = input<boolean>(false);
  isNew = input<boolean>(false);
  showLinkError = input<boolean>(false);

  /**
   * Available routes that are offered to the user for selection.
   */
  linkOptions = input<{ value: string; label: string }[]>([]);

  /**
   * If true: show free-text input. If false: show dropdown with linkOptions.
   */
  customLinkMode = linkedSignal(() => {
    const linkOptions = this.linkOptions();
    const item = this.item();

    // If no options are available, always start in custom link mode
    if (!linkOptions || linkOptions.length === 0) {
      return true;
    }

    // If there's a link value but it's not in the available options, switch to custom mode
    if (
      item?.link &&
      !linkOptions.some((option) => option.value === item.link)
    ) {
      return true;
    }

    return false;
  });

  /**
   * Whether this item is intentionally configured as a parent section without a link.
   */
  noLinkMode = linkedSignal(() => !this.isNew() && !this.item()?.link?.trim());

  linkErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (_control: FormControl | null): boolean => {
      return this.showLinkError() && !this.item()?.link?.trim();
    },
  };

  async toggleNoLinkMode(event: MatSlideToggleChange) {
    if (event.checked && this.item()?.link?.trim()) {
      // Warn before removing an existing link.
      const confirmed = await this.confirmationDialog.getConfirmation(
        $localize`:Confirmation title for removing link from menu item:Remove link?`,
        $localize`:Confirmation message for removing link from menu item:This item currently has a link. Turning this on will remove it. Do you still want to proceed?`,
      );

      if (!confirmed) {
        event.source.checked = false;
        return;
      }

      const newItem = { ...this.item() };
      delete newItem.link;
      this.item.set(newItem);
    }

    this.noLinkMode.set(event.checked);
  }

  isNoLinkModeEnabled(): boolean {
    return this.noLinkMode();
  }

  itemLabel = linkedSignal({
    source: this.item,
    computation: (item) => item?.label ?? "",
  });

  itemLink = linkedSignal({
    source: this.item,
    computation: (item) => item?.link ?? "",
  });

  itemIcon = linkedSignal({
    source: this.item,
    computation: (item) => item?.icon ?? "",
  });

  constructor() {
    effect(() => {
      const label = this.itemLabel();
      const link = this.itemLink();
      const icon = this.itemIcon();
      const current = this.item();
      if (
        label !== (current?.label ?? "") ||
        link !== (current?.link ?? "") ||
        icon !== (current?.icon ?? "")
      ) {
        this.item.set({ ...current, label, link, icon });
      }
    });
  }
}
