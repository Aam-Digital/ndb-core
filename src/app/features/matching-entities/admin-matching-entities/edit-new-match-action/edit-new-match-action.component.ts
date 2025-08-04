import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
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

@Component({
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
  ],
  templateUrl: "./edit-new-match-action.component.html",
  styleUrl: "./edit-new-match-action.component.scss",
})
export class EditNewMatchActionComponent implements OnInit {
  readonly fb = inject(FormBuilder);
  readonly entityRegistry = inject(EntityRegistry);
  readonly dialog = inject(MatDialog);
  readonly entityRelationsService = inject(EntityRelationsService);

  @Input() value: NewMatchAction;
  @Output() valueChange = new EventEmitter<NewMatchAction>();

  @Input() leftEntityType: string;
  @Input() rightEntityType: string;

  form: FormGroup;

  /**
   * Entities common to both sides, each with its available left/right reference fields.
   */
  availableRelatedEntities: {
    label: string;
    entityType: string;
    leftReferenceFields: string[];
    rightReferenceFields: string[];
  }[] = [];
  availableFields: ColumnConfig[] = [];

  /** Available field IDs for left-side match property based on selected entity. */
  matchPropertyLeftOptions: string[] = [];
  /** Available field IDs for right-side match property based on selected entity. */
  matchPropertyRightOptions: string[] = [];

  get activeFields(): ColumnConfig[] {
    return this._activeFields;
  }

  set activeFields(fields: ColumnConfig[]) {
    this._activeFields = fields;
    if (this.form?.value) {
      this.valueChange.emit({
        ...this.value,
        ...this.form.value,
        columnsToReview: this._activeFields,
      });
    }
  }

  private _activeFields: ColumnConfig[] = [];

  /** The currently selected entity constructor for generating field options. */
  entityConstructor: EntityConstructor;

  ngOnInit() {
    if (this.value) {
      this.availableRelatedEntities = this.buildAvailableRelatedEntities(
        this.leftEntityType,
        this.rightEntityType,
      );

      this.initForm();
      this.updateMatchOptions(this.value.newEntityType);

      this.activeFields = this.value.columnsToReview;
      this.form.valueChanges.subscribe((formValues) => {
        this.valueChange.emit({
          ...this.value,
          ...formValues,
          columnsToReview: this.activeFields,
        });
      });
    }
  }

  initForm() {
    this.form = this.fb.group({
      newEntityType: [this.value?.newEntityType ?? ""],
      newEntityMatchPropertyLeft: [
        this.value?.newEntityMatchPropertyLeft ?? "",
      ],
      newEntityMatchPropertyRight: [
        this.value?.newEntityMatchPropertyRight ?? "",
      ],
    });
  }

  /**
   * Builds the list of related entities common to both sides.
   */
  private buildAvailableRelatedEntities(
    leftType: string,
    rightType: string,
  ): typeof this.availableRelatedEntities {
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
      .filter((e) => e) as typeof this.availableRelatedEntities;
  }

  /**
   * Hide any option not part of the left-side matchPropertyLeftOptions list.
   * @param option The form field configuration to evaluate.
   */
  hideLeftOption = (option: FormFieldConfig): boolean => {
    return (
      this.matchPropertyLeftOptions.length > 0 &&
      !this.matchPropertyLeftOptions.includes(option.id)
    );
  };

  /**
   * Hide any option not part of the right-side matchPropertyRightOptions list.
   * @param option The form field configuration to evaluate.
   */
  hideRightOption = (option: FormFieldConfig): boolean => {
    return (
      this.matchPropertyRightOptions.length > 0 &&
      !this.matchPropertyRightOptions.includes(option.id)
    );
  };

  /**
   * Triggered when the selected entity type changes.
   * Updates match options and resets fields if needed.
   * @param newType The newly selected entity type identifier.
   */
  onEntityTypeChange(newType: string | string[]) {
    this.updateMatchOptions(newType as string, true);
    this.value.newEntityType = newType as string;
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
    this.entityConstructor = this.entityRegistry.get(entityType) ?? null;
    const targetEntitySchemaFields = Array.from(
      this.entityConstructor?.schema.keys() ?? [],
    );
    this.availableFields = Array.from(
      new Set([...(this.activeFields ?? []), ...targetEntitySchemaFields]),
    );
    if (clearExisting) {
      this.form.patchValue({
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
      });
      this.activeFields = [];
    }
    const selected = this.availableRelatedEntities?.find(
      (e) => e.entityType === entityType,
    ) as (typeof this.availableRelatedEntities)[0];
    this.matchPropertyLeftOptions = selected?.leftReferenceFields || [];
    this.matchPropertyRightOptions = selected?.rightReferenceFields || [];
    this.applySingleOptionDefaults();
  }

  /**
   * Auto-selects matchProperty controls when only a single option exists.
   */
  private applySingleOptionDefaults(): void {
    if (this.matchPropertyLeftOptions.length === 1) {
      this.form.patchValue({
        newEntityMatchPropertyLeft: this.matchPropertyLeftOptions[0],
      });
    }
    if (this.matchPropertyRightOptions.length === 1) {
      this.form.patchValue({
        newEntityMatchPropertyRight: this.matchPropertyRightOptions[0],
      });
    }
  }

  get fieldsAsStrings(): string[] {
    return this.value?.columnsToReview?.map((field) =>
      typeof field === "string" ? field : field.id,
    );
  }
}
