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
import { ColumnConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AdminListManagerComponent } from "../../admin-list-manager/admin-list-manager.component";

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
  ],
  templateUrl: "./edit-matching-view.component.html",
  styleUrl: "./edit-matching-view.component.scss",
})
export class EditMatchingViewComponent implements OnInit {
  @Input() value: NewMatchAction;
  @Output() valueChange = new EventEmitter<NewMatchAction>();

  form: FormGroup;
  activeFields: ColumnConfig[];
  entityConstructor: EntityConstructor;

  constructor(
    private entityRegistry: EntityRegistry,
    readonly dialog: MatDialog,
  ) {}

  ngOnInit() {
    if (this.value) {
      this.initForm();
      this.activeFields = this.value.columnsToReview;
      this.entityConstructor =
        this.entityRegistry.get(this.value?.newEntityType) ?? null;
    }
  }

  initForm() {
    this.form = new FormGroup({
      newEntityType: new FormControl({
        value: this.value?.newEntityType ?? "",
        disabled: true,
      }),
      newEntityMatchPropertyLeft: new FormControl({
        value: this.value?.newEntityMatchPropertyLeft ?? "",
        disabled: true,
      }),
      newEntityMatchPropertyRight: new FormControl({
        value: this.value?.newEntityMatchPropertyRight ?? "",
        disabled: true,
      }),
    });
  }
}
