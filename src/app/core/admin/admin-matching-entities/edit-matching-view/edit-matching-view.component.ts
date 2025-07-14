import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { EntityTypeSelectComponent } from "app/core/entity/entity-type-select/entity-type-select.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
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

@Component({
  selector: "app-edit-matching-view",
  imports: [
    MatInputModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    EntityTypeSelectComponent,
    HelpButtonComponent,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    AdminListManagerComponent,
    EntityFieldSelectComponent,
  ],
  templateUrl: "./edit-matching-view.component.html",
  styleUrl: "./edit-matching-view.component.scss",
})
export class EditMatchingViewComponent implements OnInit {
  @Input() value: NewMatchAction;
  @Output() valueChange = new EventEmitter<NewMatchAction>();

  form: FormGroup;
  _activeFields: ColumnConfig[] = [];

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

  entityConstructor: EntityConstructor;

  constructor(
    private entityRegistry: EntityRegistry,
    readonly dialog: MatDialog,
  ) {}

  ngOnInit() {
    if (this.value) {
      this.initForm();
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
    this.form = new FormGroup({
      newEntityType: new FormControl(this.value?.newEntityType ?? ""),
      newEntityMatchPropertyLeft: new FormControl(
        this.value?.newEntityMatchPropertyLeft ?? "",
      ),
      newEntityMatchPropertyRight: new FormControl(
        this.value?.newEntityMatchPropertyRight ?? "",
      ),
    });
  }

  hideNonEntityFields = (option: FormFieldConfig): boolean => {
    return option?.dataType !== "entity";
  };

  onEntityTypeChange(newType: string | string[]) {
    this.entityConstructor = this.entityRegistry.get(newType as string) ?? null;
    if (this.value.newEntityType === newType) return;
    this.form.patchValue({
      newEntityMatchPropertyLeft: "",
      newEntityMatchPropertyRight: "",
    });
    this.activeFields = [];
  }
}
