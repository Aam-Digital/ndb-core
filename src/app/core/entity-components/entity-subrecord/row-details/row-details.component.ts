import { Component, Inject } from "@angular/core";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../../entity/entity-remove.service";
import { AlertService } from "../../../alerts/alert.service";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import { DialogCloseComponent } from "../../../common-components/dialog-close/dialog-close.component";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import { NgForOf, NgIf } from "@angular/common";
import { PillComponent } from "../../../common-components/pill/pill.component";
import { DynamicComponentDirective } from "../../../view/dynamic-components/dynamic-component.directive";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Router, RouterLink } from "@angular/router";

/**
 * Data interface that must be given when opening the dialog
 */
export interface DetailsComponentData {
  /** The row to edit / view */
  entity: Entity;
  /** The columns to edit / view */
  columns: FormFieldConfig[];
  /** Additional columns that only provide context information */
  viewOnlyColumns?: FormFieldConfig[];
}

/**
 * Displays a single row of a table as a dialog component
 */
@UntilDestroy()
@Component({
  selector: "app-row-details",
  templateUrl: "./row-details.component.html",
  imports: [
    DialogCloseComponent,
    MatDialogModule,
    EntityFormComponent,
    NgForOf,
    PillComponent,
    DynamicComponentDirective,
    NgIf,
    MatButtonModule,
    MatMenuModule,
    FontAwesomeModule,
    Angulartics2Module,
    DisableEntityOperationDirective,
    MatTooltipModule,
    RouterLink,
  ],
  standalone: true,
})
export class RowDetailsComponent {
  form: EntityForm<Entity>;
  columns: FormFieldConfig[][];

  viewOnlyColumns: FormFieldConfig[];
  tempEntity: Entity;
  detailsRoute: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetailsComponentData,
    private dialogRef: MatDialogRef<RowDetailsComponent, Entity>,
    private formService: EntityFormService,
    private ability: EntityAbility,
    private entityRemoveService: EntityRemoveService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.form = this.formService.createFormGroup(data.columns, data.entity);
    this.columns = data.columns.map((col) => [col]);
    if (!this.data.entity.isNew && this.ability.cannot("update", data.entity)) {
      this.form.disable();
    }
    this.tempEntity = this.data.entity;
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const dynamicConstructor: any = data.entity.getConstructor();
      this.tempEntity = Object.assign(new dynamicConstructor(), value);
    });
    this.viewOnlyColumns = data.viewOnlyColumns;
    if (!this.data.entity.isNew) {
      this.initializeDetailsRouteIfAvailable();
    }
  }

  private initializeDetailsRouteIfAvailable() {
    let route = this.data.entity.getConstructor().route;
    if (
      route &&
      this.router.config.some((r) => "/" + r.path === route + "/:id")
    ) {
      this.detailsRoute = route + "/" + this.data.entity.getId();
    }
  }

  save() {
    this.formService
      .saveChanges(this.form, this.data.entity)
      .then((res) => this.dialogRef.close(res))
      .catch((err) => {
        if (!(err instanceof InvalidFormFieldError)) {
          this.alertService.addDanger(err.message);
        }
      });
  }

  delete() {
    this.entityRemoveService.remove(this.data.entity).subscribe((res) => {
      if (res === RemoveResult.REMOVED) {
        this.dialogRef.close();
      }
    });
  }
}
