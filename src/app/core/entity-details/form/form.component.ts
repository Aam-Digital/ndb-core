import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { getParentUrl } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import {
  EntityForm,
  EntityFormService,
} from "../../common-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { MatButtonModule } from "@angular/material/button";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FieldGroup } from "./field-group";
import { Subject, takeUntil } from "rxjs";
import { AbilityService } from "../../permissions/ability/ability.service";

/**
 * A simple wrapper function of the EntityFormComponent which can be used as a dynamic component
 * e.g. as a panel for the EntityDetailsComponent.
 */
@DynamicComponent("Form")
@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
  imports: [
    MatButtonModule,
    NgIf,
    EntityFormComponent,
    DisableEntityOperationDirective,
  ],
  standalone: true,
})
export class FormComponent<E extends Entity>
  implements FormConfig, OnInit, OnDestroy
{
  @Input() entity: E;
  @Input() creatingNew = false;

  @Input() fieldGroups: FieldGroup[];

  filteredFieldGroups: FieldGroup[];

  form: EntityForm<E>;

  private _destroyed = new Subject<void>();

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService,
    private abilityService: AbilityService,
  ) {}

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }

  ngOnInit() {
    this.filterFieldGroupsByPermissions();

    this.form = this.entityFormService.createFormGroup(
      [].concat(...this.filteredFieldGroups.map((group) => group.fields)),
      this.entity,
    );

    this.form.statusChanges.pipe(takeUntil(this._destroyed)).subscribe((_) => {
      this.disableReadOnlyFormControls();
    });

    if (!this.creatingNew) {
      this.form.disable();
    } else {
      this.disableReadOnlyFormControls();
    }
  }

  async saveClicked() {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.form.markAsPristine();
      this.form.disable();
      if (this.creatingNew) {
        await this.router.navigate([
          getParentUrl(this.router),
          this.entity.getId(),
        ]);
      }
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  cancelClicked() {
    if (this.creatingNew) {
      this.location.back();
    }
    this.entityFormService.resetForm(this.form, this.entity);
    this.form.disable();
  }

  private filterFieldGroupsByPermissions() {
    this.filteredFieldGroups = this.fieldGroups
      .map((group) => {
        group.fields = group.fields.filter((field) =>
          this.abilityService.hasReadPermission(this.entity, field),
        );
        return group;
      })
      .filter((group) => group.fields.length !== 0);
  }

  private disableReadOnlyFormControls() {
    Object.keys(this.form.controls).forEach((fieldId) => {
      if (!this.abilityService.hasEditPermission(this.entity, fieldId)) {
        this.form.get(fieldId).disable({ onlySelf: true, emitEvent: false });
      }
    });
  }
}

/**
 * Config format that the FormComponent handles.
 */
export interface FormConfig {
  fieldGroups: FieldGroup[];
}
