import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EntitySelectComponent } from "../../common-components/entity-select/entity-select.component";
import { Entity } from "../../entity/model/entity";
import { BasicAutocompleteComponent } from "../../common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityDuplicatesService } from "../entity-duplicates.service";
import { BehaviorSubject, merge, of, switchMap } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AsyncPipe, NgIf, NgStyle, NgTemplateOutlet } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from "@angular/material/form-field";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatTooltip } from "@angular/material/tooltip";
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";
import { MatOption, MatSelect } from "@angular/material/select";
import { HelpButtonComponent } from "../../common-components/help-button/help-button.component";
import { MatCard } from "@angular/material/card";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { MatButton } from "@angular/material/button";

/**
 * Offer the user an option to select an existing entity that is similar to the data filled in the form
 * (instead of creating that as a new entity).
 */
@UntilDestroy()
@Component({
  selector: "app-existing-entity-load",
  standalone: true,
  imports: [
    EntitySelectComponent,
    BasicAutocompleteComponent,
    AsyncPipe,
    NgTemplateOutlet,
    EntityBlockComponent,
    MatFormField,
    MatLabel,
    FaIconComponent,
    MatTooltip,
    NgIf,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
    NgStyle,
    MatSuffix,
    HelpButtonComponent,
    MatCard,
    MatSlideToggle,
    MatButton,
  ],
  templateUrl: "./existing-entity-load.component.html",
  styleUrl: "./existing-entity-load.component.scss",
})
export class ExistingEntityLoadComponent<E extends Entity = Entity>
  implements OnChanges
{
  /**
   * the overall form, containing all relevant entity fields of the entity
   * for which this component should monitor possible duplicates
   */
  @Input() form: FormGroup;
  @Input() entityType: string;

  /**
   * newly created entity with default values
   * especially including the property needed to link this to the related entity from which the form may have been opened.
   */
  @Input() defaultEntity: E;

  suggestedEntities: BehaviorSubject<E[]> = new BehaviorSubject<E[]>([]);
  selectedEntity?: E;

  addedFormControls: string[] = [];
  selectedEntityForm: FormControl<E>;

  constructor(
    private entityDuplicatesService: EntityDuplicatesService,
    private confirmationDialog: ConfirmationDialogService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.form) {
      this.initDuplicateLoader();
    }
  }

  private initDuplicateLoader() {
    this.selectedEntityForm = new FormControl<E>(this.selectedEntity);
    this.selectedEntityForm.valueChanges.subscribe((v) => this.selectEntity(v));

    merge(of({}), this.form.valueChanges)
      .pipe(
        switchMap((formValues) =>
          this.entityDuplicatesService.getSimilarEntities(
            this.defaultEntity,
            formValues,
          ),
        ),
        untilDestroyed(this),
      )
      .subscribe((v) => {
        this.suggestedEntities.next(v);
      });
  }

  async selectEntity(selected: E) {
    if (await this.userConfirmsOverwriteIfNecessary(this.selectedEntity)) {
      this.selectedEntity = selected;
      this.addRelevantValueToRelevantProperty(this.selectedEntity);
      this.setAllFormValues(this.selectedEntity);
      // TODO: required? this.currentValues = this.parent.getRawValue();
    } else {
      return;
      //this.selectedEntity = this.previousSelectedEntity;
    }
  }

  private async userConfirmsOverwriteIfNecessary(entity: Entity) {
    return (
      !this.valuesChanged() ||
      this.confirmationDialog.getConfirmation(
        $localize`:Discard the changes made:Discard changes`,
        $localize`Do you want to discard the changes made to '${entity}'?`,
      )
    );
  }

  private valuesChanged() {
    // TODO: reliably detect changes?
    return this.selectedEntity && this.form.dirty;

    /*
    return Object.entries(this.currentValues).some(
      ([prop, value]) =>
        prop !== this.formControlName &&
        value !== this.parent.controls[prop].value,
    );
     */
  }

  /**
   * Apply the values to the selected entity that link this to the related entity
   * @private
   */
  private addRelevantValueToRelevantProperty(selected: Entity) {
    if (!selected) {
      return;
    }

    for (const [key, value] of Object.entries(this.defaultEntity)) {
      const fieldSchema = this.defaultEntity.getSchema().get(key);
      if (!fieldSchema) {
        continue;
      }

      if (fieldSchema.isArray) {
        if (!Array.isArray(this.defaultEntity[key])) {
          continue;
        }

        if (!selected[key]) {
          selected[key] = [];
        }

        this.defaultEntity[key].forEach((v) => {
          if (!selected[key].includes(v)) {
            selected[key].push(v);
          }
        });
      } else {
        if (selected.hasOwnProperty(key)) {
          // do not overwrite an existing, single-value field
          continue;
        }

        selected[key] = this.defaultEntity[key];
      }
    }
  }

  private setAllFormValues(selected: Entity) {
    // TODO: reset additionally added values from previously selected
    this.form.reset();

    if (selected) {
      Object.keys(selected)
        .filter((key) => selected.getSchema().has(key))
        .forEach((key) => {
          if (this.form.controls.hasOwnProperty(key)) {
            this.form.controls[key].setValue(selected[key]);
          } else {
            // adding missing controls so saving does not lose any data
            this.form.addControl(key, new FormControl(selected[key]));
            this.addedFormControls.push(key);
          }
        });

      // enable save button:
      this.form.markAsDirty();
    }
  }

  resetToCreateNew() {
    this.selectedEntity = undefined;
    this.setAllFormValues(this.defaultEntity);
  }
}
