import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { ViewDirective } from "../../../core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityFieldLabelComponent } from "../../../core/entity/entity-field-label/entity-field-label.component";
import { AuditRecord } from "../model/audit-record";

/**
 * Which fields one audited change touched, as labelled chips.
 *
 * A write can legitimately touch no visible field, and what that means depends
 * on the kind of write - a creation has no prior state to differ from, and a
 * deletion replicates as a tombstone stripped of its content - so each gets its
 * own wording rather than an empty cell.
 */
@DynamicComponent("ChangeHistoryChangedFields")
@Component({
  selector: "app-change-history-changed-fields",
  imports: [MatChipsModule, EntityFieldLabelComponent],
  template: `
    @if (fields().length > 0) {
      <mat-chip-set>
        @for (field of fields(); track field) {
          <mat-chip>
            <app-entity-field-label
              [field]="field"
              [entityType]="recordType()"
            ></app-entity-field-label>
          </mat-chip>
        }
      </mat-chip-set>
    } @else if (action() === "created") {
      <span class="text-secondary" i18n="Change log changed fields"
        >new record</span
      >
    } @else if (action() === "deleted") {
      <span class="text-secondary" i18n="Change log changed fields"
        >record removed</span
      >
    } @else {
      <span class="text-secondary" i18n="Change log changed fields"
        >no visible field changes</span
      >
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeHistoryChangedFieldsComponent extends ViewDirective<
  string[]
> {
  override entity = input<AuditRecord>();

  readonly fields = computed(() => this.value() ?? []);
  readonly action = computed(() => this.entity()?.action);
  /** the changed record's type, which the field labels are resolved against */
  readonly recordType = computed(() => this.entity()?.recordType);
}
