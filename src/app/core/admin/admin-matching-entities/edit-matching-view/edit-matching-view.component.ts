import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormGroup, ReactiveFormsModule, FormBuilder } from "@angular/forms";
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
import { AdminListManagerComponent } from "../../admin-list-manager/admin-list-manager.component";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { EntityRelationsService } from "#src/app/core/entity/entity-mapper/entity-relations.service";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-edit-matching-view",
  imports: [
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    HelpButtonComponent,
    ReactiveFormsModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    AdminListManagerComponent,
    EntityFieldSelectComponent,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: "./edit-matching-view.component.html",
  styleUrl: "./edit-matching-view.component.scss",
})
export class EditMatchingViewComponent implements OnInit {
  @Input() value: NewMatchAction;
  @Input() leftSideEntity: EntityConstructor;
  @Input() rightSideEntity: EntityConstructor;

  @Output() valueChange = new EventEmitter<NewMatchAction>();

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

  constructor(
    readonly fb: FormBuilder,
    readonly entityRegistry: EntityRegistry,
    readonly dialog: MatDialog,
    readonly entityRelationsService: EntityRelationsService,
  ) {}

  ngOnInit() {
    if (this.value) {
      this.availableRelatedEntities = this.buildAvailableRelatedEntities(
        this.leftSideEntity.ENTITY_TYPE,
        this.rightSideEntity.ENTITY_TYPE,
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
    if (clearExisting) {
      this.form.patchValue({
        newEntityMatchPropertyLeft: "",
        newEntityMatchPropertyRight: "",
      });
      this.activeFields = [];
    }
    const selected = this.availableRelatedEntities.find(
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
}
