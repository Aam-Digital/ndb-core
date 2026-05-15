import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  OnDestroy,
  input,
  model,
  signal,
} from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from "@angular/material/expansion";
import { NewMatchAction } from "#src/app/features/matching-entities/matching-entities/matching-entities-config";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
} from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { EntityFieldsMenuComponent } from "#src/app/core/common-components/entity-fields-menu/entity-fields-menu.component";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { Subject, takeUntil } from "rxjs";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-new-match-action",
  imports: [
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    HelpButtonComponent,
    ReactiveFormsModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    EntityFieldSelectComponent,
    MatOptionModule,
    MatSelectModule,
    EntityFieldsMenuComponent,
    EntityTypeSelectComponent,
  ],
  templateUrl: "./edit-new-match-action.component.html",
  styleUrl: "./edit-new-match-action.component.scss",
})
export class EditNewMatchActionComponent implements OnDestroy {
  readonly fb = inject(FormBuilder);
  readonly entityRegistry = inject(EntityRegistry);
  readonly dialog = inject(MatDialog);
  readonly entityRelationsService = inject(EntityRelationsService);
  private readonly destroyed$ = new Subject<void>();

  value = model<NewMatchAction>();
  leftEntityType = input<string>();
  rightEntityType = input<string>();

  form: FormGroup;

  /**
   * Entities common to both sides, each with its available left/right reference fields.
   */
  availableRelatedEntities = computed(() =>
    this.buildAvailableRelatedEntities(
      this.leftEntityType(),
      this.rightEntityType(),
    ),
  );
  availableFields = signal<ColumnConfig[]>([]);

  /** Available field IDs for left-side match property based on selected entity. */
  matchPropertyLeftOptions = signal<string[]>([]);
  /** Available field IDs for right-side match property based on selected entity. */
  matchPropertyRightOptions = signal<string[]>([]);

  activeFields = signal<ColumnConfig[]>([]);

  protected setActiveFields(fields: ColumnConfig[]): void {
    this.activeFields.set(fields);
    if (this.form?.value) {
      this.value.set({
        ...this.value(),
        ...this.form.value,
        columnsToReview: fields,
      });
    }
  }

  /** The currently selected entity constructor for generating field options. */
  entityConstructor = signal<EntityConstructor | null>(null);

  constructor() {
    effect(() => {
      const value = this.value();
      // Also read entity type signals to recompute options when they change
      this.leftEntityType();
      this.rightEntityType();

      if (!value) {
        return;
      }

      if (!this.form) {
        this.initForm();
        this.form.valueChanges
          .pipe(takeUntil(this.destroyed$))
          .subscribe((formValues) => {
            this.value.set({
              ...this.value(),
              ...formValues,
              columnsToReview: this.activeFields(),
            });
          });
      } else {
        this.form.patchValue(
          {
            newEntityType: value.newEntityType ?? "",
            newEntityMatchPropertyLeft: value.newEntityMatchPropertyLeft ?? "",
            newEntityMatchPropertyRight:
              value.newEntityMatchPropertyRight ?? "",
          },
          { emitEvent: false },
        );
      }

      this.activeFields.set(value.columnsToReview ?? []);
      this.updateMatchOptions(value.newEntityType);
    });
  }

  initForm() {
    const value = this.value();
    this.form = this.fb.group({
      newEntityType: [value?.newEntityType ?? ""],
      newEntityMatchPropertyLeft: [value?.newEntityMatchPropertyLeft ?? ""],
      newEntityMatchPropertyRight: [value?.newEntityMatchPropertyRight ?? ""],
    });
  }

  /**
   * Builds the list of related entities common to both sides.
   */
  private buildAvailableRelatedEntities(leftType: string, rightType: string) {
    if (!leftType || !rightType) {
      return [];
    }
    const left = this.entityRelationsService
      .getEntityTypesReferencingType(leftType)
      .map((refType) => ({
        label: refType.entityType.label || refType.entityType.ENTITY_TYPE,
        entityType: refType.entityType.ENTITY_TYPE,
        relatedReferenceFields: refType.referencingProperties.map((p) => p.id),
      }));
    const right = this.entityRelationsService
      .getEntityTypesReferencingType(rightType)
      .map((refType) => ({
        label: refType.entityType.label || refType.entityType.ENTITY_TYPE,
        entityType: refType.entityType.ENTITY_TYPE,
        relatedReferenceFields: refType.referencingProperties.map((p) => p.id),
      }));
    return left
      .map((l) => {
        const r = right.find((r) => r.entityType === l.entityType);
        return r
          ? {
              label: l.label,
              entityType: l.entityType,
              leftReferenceFields: l.relatedReferenceFields,
              rightReferenceFields: r.relatedReferenceFields,
            }
          : null;
      })
      .filter((e): e is NonNullable<typeof e> => !!e);
  }

  /**
   * Hide any option not part of the left-side matchPropertyLeftOptions list.
   * @param option The form field configuration to evaluate.
   */
  hideLeftOption = (option: FormFieldConfig): boolean => {
    return (
      this.matchPropertyLeftOptions().length > 0 &&
      !this.matchPropertyLeftOptions().includes(option.id)
    );
  };

  /**
   * Hide any option not part of the right-side matchPropertyRightOptions list.
   * @param option The form field configuration to evaluate.
   */
  hideRightOption = (option: FormFieldConfig): boolean => {
    return (
      this.matchPropertyRightOptions().length > 0 &&
      !this.matchPropertyRightOptions().includes(option.id)
    );
  };

  /**
   * Triggered when the selected entity type changes.
   * Updates match options and resets fields if needed.
   * @param newType The newly selected entity type identifier.
   */
  onEntityTypeChange(newType: string | string[]) {
    const selectedEntityType = newType as string;
    if (selectedEntityType === this.value()?.newEntityType) {
      return;
    }
    this.updateMatchOptions(selectedEntityType, true);
    if (!this.value()) {
      return;
    }
    this.value.set({
      ...this.value(),
      newEntityType: selectedEntityType,
    });
  }

  /**
   * Update entityConstructor and match property options.
   * @param entityType The entity type to configure.
   * @param clearExisting Whether to clear existing selections.
   */
  private updateMatchOptions(
    entityType: string,
    clearExisting: boolean = false,
  ): void {
    if (!entityType) {
      this.entityConstructor.set(null);
      this.availableFields.set(Array.from(new Set(this.activeFields() ?? [])));
      this.matchPropertyLeftOptions.set([]);
      this.matchPropertyRightOptions.set([]);
      if (clearExisting) {
        this.form.patchValue({
          newEntityMatchPropertyLeft: "",
          newEntityMatchPropertyRight: "",
        });
        this.setActiveFields([]);
      }
      return;
    }

    try {
      this.entityConstructor.set(this.entityRegistry.get(entityType) ?? null);
    } catch {
      this.entityConstructor.set(null);
    }

    const targetEntitySchemaFields = Array.from(
      this.entityConstructor()?.schema.keys() ?? [],
    );
    this.availableFields.set(
      Array.from(
        new Set([...(this.activeFields() ?? []), ...targetEntitySchemaFields]),
      ),
    );
    if (clearExisting) {
      this.form.patchValue({
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
      });
      this.setActiveFields([]);
    }
    const selected = this.availableRelatedEntities().find(
      (e) => e.entityType === entityType,
    );
    this.matchPropertyLeftOptions.set(selected?.leftReferenceFields ?? []);
    this.matchPropertyRightOptions.set(selected?.rightReferenceFields ?? []);
    this.applySingleOptionDefaults();
  }

  /**
   * Auto-selects matchProperty controls when only a single option exists.
   */
  private applySingleOptionDefaults(): void {
    if (
      this.matchPropertyLeftOptions().length === 1 &&
      this.form.get("newEntityMatchPropertyLeft")?.value !==
        this.matchPropertyLeftOptions()[0]
    ) {
      this.form.patchValue({
        newEntityMatchPropertyLeft: this.matchPropertyLeftOptions()[0],
      });
    }
    if (
      this.matchPropertyRightOptions().length === 1 &&
      this.form.get("newEntityMatchPropertyRight")?.value !==
        this.matchPropertyRightOptions()[0]
    ) {
      this.form.patchValue({
        newEntityMatchPropertyRight: this.matchPropertyRightOptions()[0],
      });
    }
  }

  fieldsAsStrings = computed(() =>
    this.value()?.columnsToReview?.map((field) =>
      typeof field === "string" ? field : field.id,
    ),
  );

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
