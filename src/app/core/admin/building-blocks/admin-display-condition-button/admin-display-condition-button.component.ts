import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DataFilter } from "../../../filter/filters/filters";
import { EntityConstructor } from "../../../entity/model/entity";
import {
  ConditionEditorDialogComponent,
  ConditionEditorDialogData,
} from "../../../common-components/condition-editor-dialog/condition-editor-dialog.component";

/**
 * Button to edit the display condition of a field or field group in the admin UI.
 *
 * Opens the condition editor dialog on click and reports the result through `conditionChange`,
 * so the same button works for anything that has a `displayCondition`.
 * Highlighted in the accent color while a condition is configured.
 */
@Component({
  selector: "app-admin-display-condition-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent, MatButtonModule, MatTooltipModule],
  // inline-block so that parents can apply vertical margins to the button
  styles: `
    :host {
      display: inline-block;
    }
  `,
  template: `
    @if (showLabel()) {
      <button
        mat-stroked-button
        type="button"
        [color]="color()"
        [matTooltip]="tooltip()"
        (click)="openDialog()"
      >
        <fa-icon icon="filter" class="standard-icon-with-text"></fa-icon>
        {{ label() }}
      </button>
    } @else {
      <button
        mat-icon-button
        type="button"
        [color]="color()"
        [attr.aria-label]="label()"
        [matTooltip]="tooltip()"
        (click)="openDialog()"
      >
        <fa-icon icon="filter"></fa-icon>
      </button>
    }
  `,
})
export class AdminDisplayConditionButtonComponent {
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /** The currently configured condition, if any. */
  readonly condition = input<DataFilter<any> | null>();

  /** Entity type whose fields can be selected in the condition. */
  readonly entityType = input<EntityConstructor>();

  /** What the condition applies to, used to describe it to the user. */
  readonly target = input.required<"field" | "fieldGroup">();

  /** Show a text label next to the icon instead of an icon-only button. */
  readonly showLabel = input(false);

  /**
   * Emits the new condition when the editor is saved, or `null` when the condition was removed.
   * Does not emit if the editor is cancelled.
   */
  readonly conditionChange = output<DataFilter<any> | null>();

  protected readonly color = computed(() =>
    this.condition() ? "accent" : undefined,
  );

  protected readonly label = computed(() =>
    this.condition()
      ? $localize`Edit Display Condition`
      : $localize`Create Display Condition`,
  );

  protected readonly tooltip = computed(() => {
    const isGroup = this.target() === "fieldGroup";
    if (this.condition()) {
      return isGroup
        ? $localize`Condition configured: this field group is only shown while the record matches it.`
        : $localize`Condition configured: this field is only shown while the record matches it.`;
    }
    return isGroup
      ? $localize`Only show this field group in forms if the record currently matches a condition, based on the values of other fields.`
      : $localize`Only show this field in forms if the record currently matches a condition, based on the values of other fields.`;
  });

  protected openDialog() {
    const isGroup = this.target() === "fieldGroup";
    this.dialog
      .open(ConditionEditorDialogComponent, {
        data: {
          entityConstructor: this.entityType(),
          conditions: this.condition(),
          explanation: isGroup
            ? $localize`This field group is shown only while the record matches...`
            : $localize`This field is shown only while the record matches...`,
        } satisfies ConditionEditorDialogData,
        width: "600px",
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        // `undefined` means the dialog was cancelled, leave the condition unchanged
        if (result === undefined) return;
        this.conditionChange.emit(result);
      });
  }
}
