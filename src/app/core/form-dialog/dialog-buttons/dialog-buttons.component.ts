import { Component, Input, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { Entity } from "../../entity/model/entity";
import { FormGroup } from "@angular/forms";
import { InvalidFormFieldError } from "../../entity-components/entity-form/invalid-form-field.error";
import {
  EntityRemoveService,
  RemoveResult,
} from "../../entity/entity-remove.service";
import { EntityFormService } from "../../entity-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { MatMenuModule } from "@angular/material/menu";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Router, RouterLink } from "@angular/router";
import { EntityAbility } from "../../permissions/ability/entity-ability";

@Component({
  selector: "app-dialog-buttons",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    Angulartics2Module,
    MatDialogModule,
    DisableEntityOperationDirective,
    MatMenuModule,
    FontAwesomeModule,
    RouterLink,
  ],
  templateUrl: "./dialog-buttons.component.html",
  styleUrls: ["./dialog-buttons.component.scss"],
})
export class DialogButtonsComponent implements OnInit {
  @Input() entity: Entity;
  @Input() form: FormGroup;
  detailsRoute: string;

  constructor(
    private entityFormService: EntityFormService,
    private dialog: MatDialogRef<any>,
    private alertService: AlertService,
    private entityRemoveService: EntityRemoveService,
    private router: Router,
    private ability: EntityAbility
  ) {}

  ngOnInit() {
    if (!this.entity.isNew) {
      if (this.ability.cannot("update", this.entity)) {
        this.form.disable();
      }
      this.initializeDetailsRouteIfAvailable();
    }
  }

  private initializeDetailsRouteIfAvailable() {
    let route = this.entity.getConstructor().route;
    if (
      route &&
      this.router.config.some((r) => "/" + r.path === route + "/:id")
    ) {
      this.detailsRoute = route + "/" + this.entity.getId();
    }
  }

  async save() {
    // Maybe move to abstract class (similar to TodoDetails and RowDetails)
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.dialog.close();
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  delete() {
    this.entityRemoveService.remove(this.entity).subscribe((result) => {
      if (result === RemoveResult.REMOVED) {
        this.dialog.close();
      }
    });
  }
}
