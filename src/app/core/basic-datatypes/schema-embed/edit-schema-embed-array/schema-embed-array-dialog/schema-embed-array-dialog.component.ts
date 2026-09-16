import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { startWith, Subscription } from "rxjs";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";

/** One row of the embedded table: its own form group plus a stub EntityForm to feed EntityFieldEditComponent. */
interface EmbeddedRow {
  formGroup: FormGroup;
  form: EntityForm<any>;
  subscription: Subscription;
}

export interface SchemaEmbedArrayDialogData {
  /** The (live) outer FormControl holding the field's array value - edited directly, not copied. */
  formControl: FormControl<Record<string, any>[]>;
  /** The inner fields (table columns), resolved from the field's schema-embed configuration. */
  columns: FormFieldConfig[];
  /** The parent entity, passed through only to satisfy EntityForm's typing - never read for row cells. */
  entity?: Entity;
  /** Dialog title, typically the field's own label. */
  label?: string;
}

/**
 * Popup for editing a `schema-embed-array` field: a full table of all entries,
 * with add/remove-row actions and one generic {@link EntityFieldEditComponent} per cell.
 *
 * Edits apply immediately to the field's own FormControl (the same one bound outside the
 * dialog), exactly like the previous inline table did - there is no separate save/cancel
 * step here, the outer entity form's own Save/Cancel governs persisting or discarding.
 */
@Component({
  selector: "app-schema-embed-array-dialog",
  imports: [
    ReactiveFormsModule,
    EntityFieldEditComponent,
    MatButtonModule,
    MatDialogModule,
    DialogCloseComponent,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  templateUrl: "./schema-embed-array-dialog.component.html",
  styleUrls: ["./schema-embed-array-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaEmbedArrayDialogComponent implements OnInit, OnDestroy {
  protected readonly data = inject<SchemaEmbedArrayDialogData>(MAT_DIALOG_DATA);

  private readonly destroyRef = inject(DestroyRef);
  private readonly formControl = this.data.formControl;
  protected readonly columns = this.data.columns;

  rows = signal<EmbeddedRow[]>([]);
  isDisabled = signal(false);

  /** Authoritative list of row entries (the signal above is a snapshot copy for the template). */
  private rowEntries: EmbeddedRow[] = [];

  ngOnInit() {
    this.formControl.valueChanges
      .pipe(
        startWith(this.formControl.value ?? []),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((values) => this.syncRows(values ?? []));

    this.formControl.statusChanges
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const disabled = this.formControl.disabled;
        this.isDisabled.set(disabled);
        this.rowEntries.forEach((entry) =>
          disabled
            ? entry.formGroup.disable({ emitEvent: false })
            : entry.formGroup.enable({ emitEvent: false }),
        );
      });
  }

  addRow() {
    const current = this.formControl.value ?? [];
    this.formControl.setValue([...current, {}]);
    this.formControl.markAsDirty();
  }

  removeRow(index: number) {
    const current = this.formControl.value ?? [];
    this.formControl.setValue(current.filter((_, i) => i !== index));
    this.formControl.markAsDirty();
  }

  /**
   * Reconcile the internal row entries with an externally/self set array value.
   *
   * Only pushes/pops entries for added/removed rows and only patches a surviving row's
   * FormGroup when its content actually differs - this is what avoids wiping out the
   * user's focus/input on every keystroke, since the row currently being typed into is
   * always already in sync with the value that triggered this call.
   */
  private syncRows(values: Record<string, any>[]) {
    while (this.rowEntries.length < values.length) {
      this.addRowEntry(values[this.rowEntries.length] ?? {});
    }
    while (this.rowEntries.length > values.length) {
      const removed = this.rowEntries.pop();
      removed?.subscription.unsubscribe();
    }

    values.forEach((value, i) => {
      const formGroup = this.rowEntries[i].formGroup;
      if (
        JSON.stringify(formGroup.getRawValue()) !== JSON.stringify(value ?? {})
      ) {
        formGroup.patchValue(value ?? {}, { emitEvent: false });
      }
    });

    this.rows.set([...this.rowEntries]);
  }

  private addRowEntry(value: Record<string, any>) {
    const formGroup = this.buildRowFormGroup(value);
    if (this.isDisabled()) {
      formGroup.disable({ emitEvent: false });
    }

    const entry: EmbeddedRow = {
      formGroup,
      form: {
        formGroup: formGroup as any,
        entity: this.data.entity,
        fieldConfigs: this.columns,
        onFormStateChange: new EventEmitter(),
        inheritedParentValues: new Map(),
        watcher: new Map(),
      },
      subscription: undefined,
    };
    entry.subscription = formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newValue) => this.onRowChange(entry, newValue));

    this.rowEntries.push(entry);
  }

  private buildRowFormGroup(value: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const column of this.columns) {
      controls[column.id] = new FormControl(value?.[column.id]);
    }
    return new FormGroup(controls);
  }

  private onRowChange(entry: EmbeddedRow, value: Record<string, any>) {
    const index = this.rowEntries.indexOf(entry);
    if (index === -1) {
      return;
    }
    const current = this.formControl.value ?? [];
    const updated = current.map((row, i) => (i === index ? value : row));
    this.formControl.setValue(updated);
    this.formControl.markAsDirty();
  }

  ngOnDestroy() {
    this.rowEntries.forEach((entry) => entry.subscription.unsubscribe());
  }
}
