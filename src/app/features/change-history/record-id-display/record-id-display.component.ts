import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { Clipboard } from "@angular/cdk/clipboard";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AlertService } from "../../../core/alerts/alert.service";

/**
 * The internal id of a record, shown quietly and copyable in one click.
 *
 * A record's title identifies it only by convention: records generated from one
 * template share theirs (every event of a recurring activity), so the id is what
 * actually tells two apart. It is also what the change log's related-record
 * filter takes, and what a technical administrator needs for troubleshooting.
 *
 * Deliberately understated: readers looking for a record by name should not have
 * their attention pulled to a string that means nothing to them.
 */
@Component({
  selector: "app-record-id-display",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule],
  template: `
    @if (recordId()) {
      <span
        class="record-id truncate-text pointer"
        role="button"
        tabindex="0"
        [attr.aria-label]="copyHint"
        [matTooltip]="copyHint"
        (click)="copyId(); $event.stopPropagation()"
        (keydown.enter)="copyId()"
        (keydown.space)="$event.preventDefault(); copyId()"
        >{{ recordId() }}</span
      >
    }
  `,
  styles: [
    `
      .record-id {
        display: inline-block;
        max-width: 100%;
        font-size: 85%;
        opacity: 0.75;
      }
    `,
  ],
})
export class RecordIdDisplayComponent {
  private readonly clipboard = inject(Clipboard);
  private readonly alerts = inject(AlertService);

  /** the record's full id, e.g. `Child:5e69d648-...` */
  readonly recordId = input<string>();

  protected readonly copyHint = $localize`:Record id copy hint:This is the internal unique ID for this record. Copy this for advanced analysis or as context to help your technical administrators with troubleshooting.`;

  /**
   * Copy the id, confirming only once the clipboard actually accepted it: a
   * browser may refuse, and silently claiming success would send someone off to
   * paste something they do not have.
   */
  copyId() {
    const id = this.recordId();
    if (id && this.clipboard.copy(id)) {
      this.alerts.addInfo($localize`:Record id copied:Record ID copied`);
    }
  }
}
