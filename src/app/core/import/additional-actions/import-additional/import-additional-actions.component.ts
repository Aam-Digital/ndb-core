import { EditEntityComponent } from "#src/app/core/basic-datatypes/entity/edit-entity/edit-entity.component";
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSelectModule } from "@angular/material/select";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { EntityBlockComponent } from "../../../basic-datatypes/entity/entity-block/entity-block.component";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { AdditionalImportAction } from "../additional-import-action";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityReferenceFieldSelectorComponent } from "#src/app/entity-reference-field-selector/entity-reference-field-selector.component";
import { InheritanceOption } from "#src/app/entity-reference-field-selector/entity-reference-field-selector.component";

/**
 * Import sub-step: Let user select additional import actions like adding entities to a group entity.
 */
@Component({
  selector: "app-import-additional-actions",
  templateUrl: "./import-additional-actions.component.html",
  styleUrls: ["./import-additional-actions.component.scss"],
  standalone: true,
  imports: [
    MatListModule,
    FontAwesomeModule,
    MatTooltipModule,
    EntityBlockComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    EditEntityComponent,
    HelpButtonComponent,
    MatExpansionModule,
    MatSelectModule,
    EntityReferenceFieldSelectorComponent,
  ],
  providers: [],
})
export class ImportAdditionalActionsComponent implements OnChanges {
  private readonly entityRegistry = inject(EntityRegistry);

  @Input() entityType: string;
  @Input() importActions: AdditionalImportAction[] = [];
  @Output() importActionsChange = new EventEmitter<AdditionalImportAction[]>();

  // For the unified selector
  entityTypeCtor: any = null;
  selectedTargetEntityType: string = "";

  unifiedActionForm = new FormGroup({
    fieldOption: new FormControl(
      { value: null, disabled: true },
      Validators.required,
    ),
    targetId: new FormControl(
      { value: null, disabled: true },
      Validators.required,
    ),
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityType")) {
      this.entityTypeCtor = this.entityType
        ? this.entityRegistry.get(this.entityType)
        : null;
      this.unifiedActionForm.reset();
      if (this.entityTypeCtor) {
        this.unifiedActionForm.get("fieldOption").enable();
      } else {
        this.unifiedActionForm.get("fieldOption").disable();
        this.unifiedActionForm.get("targetId").disable();
      }
      this.selectedTargetEntityType = "";
    }
  }

  onFieldOptionSelected(option: InheritanceOption) {
    this.unifiedActionForm.get("fieldOption").setValue(option);
    // Enable/disable targetId field
    if (option) {
      this.selectedTargetEntityType =
        option.referencedEntityType?.ENTITY_TYPE || option.sourceReferenceEntity || "";
      this.unifiedActionForm.get("targetId").enable();
    } else {
      this.selectedTargetEntityType = "";
      this.unifiedActionForm.get("targetId").disable();
    }
    this.unifiedActionForm.get("targetId").setValue(null);
  }

  addUnifiedAction() {
    const option = this.unifiedActionForm.get("fieldOption").value;
    const targetId = this.unifiedActionForm.get("targetId").value;
    if (!option || !targetId) return;

    const newAction: AdditionalImportAction = {
      mode: "prefill",
      sourceType: this.entityType,
      fieldId: option.sourceReferenceField,
      targetType: this.selectedTargetEntityType,
      targetId,
    };

    this.importActions = [...(this.importActions ?? []), newAction];
    this.unifiedActionForm.reset();
    this.selectedTargetEntityType = "";
    this.importActionsChange.emit(this.importActions);
  }

  removeAction(actionToRemove: AdditionalImportAction) {
    this.importActions = this.importActions.filter((a) => a !== actionToRemove);
    this.importActionsChange.emit(this.importActions);
  }

  getFieldLabel(fieldId: string): string {
    if (!this.entityType || !fieldId) return fieldId;
    const entityCtor = this.entityRegistry.get(this.entityType);
    const fieldConfig = entityCtor?.schema.get(fieldId);
    return fieldConfig?.label || fieldId;
  }
}
