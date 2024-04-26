import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { EntityTypeLabelPipe } from "../../common-components/entity-type-label/entity-type-label.pipe";
import { AdditionalImportAction } from "./additional-import-action";
import { ImportService } from "../import.service";
import { MatListModule } from "@angular/material/list";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NgForOf, NgIf } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { MatButtonModule } from "@angular/material/button";

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
    NgForOf,
    EntityTypeLabelPipe,
    EntityBlockComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    BasicAutocompleteComponent,
    MatButtonModule,
    NgIf,
  ],
  providers: [EntityTypeLabelPipe],
})
export class ImportAdditionalActionsComponent implements OnChanges {
  @Input() entityType: string;

  @Input() importActions: AdditionalImportAction[] = [];
  @Output() importActionsChange = new EventEmitter<AdditionalImportAction[]>();

  linkableEntityTypes: string[] = [];
  typeToString = (val) => this.entityTypeLabelPipe.transform(val);
  linkableEntities: Entity[] = [];
  entityToId = (e: Entity) => e.getId();

  linkEntityForm = new FormGroup({
    type: new FormControl({ value: "", disabled: true }),
    id: new FormControl({ value: "", disabled: true }),
  });
  actionSelected: boolean;

  constructor(
    private entityMapper: EntityMapperService,
    private entityTypeLabelPipe: EntityTypeLabelPipe,
    private importService: ImportService,
  ) {
    this.linkEntityForm
      .get("type")
      .valueChanges.subscribe((val) => this.updateSelectableOptions(val));
    this.linkEntityForm
      .get("id")
      .valueChanges.subscribe((val) => (this.actionSelected = !!val));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty("entityType")) {
      this.updateSelectableTypes();
    }
  }

  private updateSelectableTypes() {
    this.linkEntityForm.reset();
    if (!this.entityType) {
      this.linkEntityForm.disable();
    } else {
      this.linkableEntityTypes = this.importService.getLinkableEntities(
        this.entityType,
      );
      this.linkEntityForm.enable();
      this.updateSelectableOptions(undefined);
    }
  }

  private async updateSelectableOptions(newLinkType: string) {
    if (newLinkType) {
      this.linkableEntities = await this.entityMapper.loadType(newLinkType);
      this.linkEntityForm.get("id").enable();
    } else {
      this.linkableEntities = [];
      this.linkEntityForm.get("id").disable();
    }
  }

  addAction() {
    const newAction = this.linkEntityForm.getRawValue();
    this.importActions = [...(this.importActions ?? []), newAction];
    this.linkEntityForm.reset();
    this.importActionsChange.emit(this.importActions);
  }

  removeAction(actionToRemove: AdditionalImportAction) {
    this.importActions = this.importActions.filter((a) => a !== actionToRemove);
    this.importActionsChange.emit(this.importActions);
  }
}
