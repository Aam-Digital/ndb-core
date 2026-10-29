import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButton } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormService } from "#src/app/core/common-components/entity-form/entity-form.service";
import { FaDynamicIconComponent } from "#src/app/core/common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { EntityFieldEditComponent } from "#src/app/core/entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldViewComponent } from "#src/app/core/entity/entity-field-view/entity-field-view.component";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntitySchemaService } from "#src/app/core/entity/schema/entity-schema.service";
import { Logging } from "#src/app/core/logging/logging.service";
import { isSameValue } from "../../get-common-value";
import { NoCommonValueHintComponent } from "../../no-common-value-hint/no-common-value-hint.component";
import { DialogRow } from "../automated-field-update.types";

/**
 * The editable value of one affected entity in the "Update related records" dialog, with its hints.
 *
 * It owns the form of the value, so that what the user entered stays while the dialog calculates
 * the suggestions again and passes in new rows.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-affected-entity-value",
  imports: [
    EntityFieldEditComponent,
    EntityFieldViewComponent,
    FaDynamicIconComponent,
    HintBoxComponent,
    MatButton,
    MatTooltipModule,
    NoCommonValueHintComponent,
  ],
  templateUrl: "./affected-entity-value.component.html",
  styleUrl: "./affected-entity-value.component.scss",
})
export class AffectedEntityValueComponent implements OnInit {
  private readonly entityFormService = inject(EntityFormService);
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly row = input.required<DialogRow>();

  /** The value the user entered (database format) */
  readonly valueChange = output<unknown>();

  /** The user wants the suggested value instead of the entered one */
  readonly useSuggestion = output<void>();

  readonly form = signal<EntityForm<Entity> | undefined>(undefined);

  private readonly fieldId = computed(() => this.row().targetFieldId);
  private readonly entityType = computed(() => this.row().targetEntityType);

  /**
   * Only created again for another field, not for every new row: a new config rebuilds the edit component,
   * which would e.g. close the dropdown in which the user is selecting values.
   */
  readonly field = computed(() =>
    this.entityFormService.extendFormFieldConfig(
      this.fieldId(),
      this.entityType(),
    ),
  );

  constructor() {
    // show a new suggestion (or the suggestion the user goes back to), which is not a change of the user
    effect(() => {
      const row = this.row();
      const control = this.form()?.formGroup.controls[row.targetFieldId];
      if (
        control &&
        !isSameValue(this.toDatabaseFormat(control.value), row.value)
      ) {
        control.setValue(this.toEntityFormat(row.value), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.createForm().catch((error) =>
      Logging.error(
        "AffectedEntityValueComponent could not create the form of the value",
        error,
      ),
    );
  }

  private async createForm(): Promise<void> {
    const row = this.row();
    // without default value handling: for existing records it only loads linked records
    // for the inherit button, which is not shown here (one query per row)
    const form = await this.entityFormService.createEntityForm(
      [row.targetFieldId],
      row.affectedEntity,
      this.destroyRef,
      false,
      true,
      false,
    );
    if (this.destroyRef.destroyed) return;

    const control = form.formGroup.controls[row.targetFieldId];
    control.setValue(this.toEntityFormat(this.row().value));
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) =>
        this.valueChange.emit(this.toDatabaseFormat(value)),
      );
    this.form.set(form);
  }

  private toEntityFormat(value: unknown) {
    return this.entitySchemaService.valueToEntityFormat(value, this.field());
  }

  private toDatabaseFormat(value: unknown) {
    return this.entitySchemaService.valueToDatabaseFormat(
      value,
      this.field(),
      this.row().affectedEntity,
    );
  }
}
