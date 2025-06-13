import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { AdditionalImportAction } from "../additional-import-action";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";

import { EntityBlockComponent } from "../../../basic-datatypes/entity/entity-block/entity-block.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BasicAutocompleteComponent } from "../../../common-components/basic-autocomplete/basic-autocomplete.component";
import { MatButtonModule } from "@angular/material/button";
import { ImportAdditionalService } from "../import-additional.service";
import { EntitySelectComponent } from "../../../common-components/entity-select/entity-select.component";
import { HelpButtonComponent } from "../../../common-components/help-button/help-button.component";
import { MatExpansionModule } from "@angular/material/expansion";

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
    EntityTypeLabelPipe,
    EntityBlockComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    BasicAutocompleteComponent,
    MatButtonModule,
    EntitySelectComponent,
    HelpButtonComponent,
    MatExpansionModule
],
  providers: [EntityTypeLabelPipe],
})
export class ImportAdditionalActionsComponent implements OnChanges {
  @Input() entityType: string;

  @Input() importActions: AdditionalImportAction[] = [];
  @Output() importActionsChange = new EventEmitter<AdditionalImportAction[]>();

  availableImportActions: AdditionalImportAction[] = [];

  // TODO: may need more distinction --> like in ImportModule?
  actionToString = (a: AdditionalImportAction) =>
    this.importAdditionalService.createActionLabel(a);

  linkEntityForm = new FormGroup({
    action: new FormControl({ value: "", disabled: true }, Validators.required),
    targetId: new FormControl(
      { value: "", disabled: true },
      Validators.required,
    ),
  });

  constructor(private importAdditionalService: ImportAdditionalService) {
    this.linkEntityForm
      .get("action")
      .valueChanges.subscribe((val) =>
        !!val
          ? this.linkEntityForm.get("targetId").enable()
          : this.linkEntityForm.get("targetId").disable(),
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityType")) {
      this.availableImportActions = this.importAdditionalService
        .getActionsLinkingFor(this.entityType)
        .sort(sortExportOnlyLast);

      this.linkEntityForm.reset();
      if (this.entityType) {
        this.linkEntityForm.get("action").enable();
      }
    }
  }

  addAction() {
    const newAction = this.linkEntityForm.get("action").getRawValue();
    this.importActions = [
      ...(this.importActions ?? []),
      {
        ...newAction,
        targetId: this.linkEntityForm.get("targetId").value,
      },
    ];
    this.linkEntityForm.reset();
    this.importActionsChange.emit(this.importActions);
  }

  removeAction(actionToRemove: AdditionalImportAction) {
    this.importActions = this.importActions.filter((a) => a !== actionToRemove);
    this.importActionsChange.emit(this.importActions);
  }
}

function sortExportOnlyLast(
  a: AdditionalImportAction,
  b: AdditionalImportAction,
) {
  // show "non-expert" actions first
  if (a.expertOnly === b.expertOnly) return 0;
  else if (a.expertOnly) return 1;
  else return -1;
}
