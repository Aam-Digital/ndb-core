import {
  AfterViewInit,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
} from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Entity } from "../../entity/model/entity";
import { MatDialogRef } from "@angular/material/dialog";
import { getUrlWithoutParams } from "../../../utils/utils";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { ConfirmationDialogService } from "app/core/confirmation-dialog/confirmation-dialog.service";
import { OperationType } from "../../permissions/entity-permissions.service";

/**
 * Use `<app-form-dialog-wrapper>` in your form templates to handle the saving and resetting of the edited entity.
 * This wrapper component ensures that the UI looks consistent for all forms
 * and also allows you to easily show the form in a dialog using the {@link FormDialogService}.
 *
 * @example
 <app-form-dialog-wrapper [entity]="myEntity">
   <h1>
     <!-- h1 element is used for dialog title -->
   </h1>
   <form #entityForm="ngForm"> <!-- marking your form with #entityForm is required -->
     <!-- add your form fields here -->
     <!-- save/cancel buttons are added by the wrapper automatically  -->
   </form>
 </app-form-dialog-wrapper>
 */
@Component({
  selector: "app-form-dialog-wrapper",
  templateUrl: "./form-dialog-wrapper.component.html",
  styleUrls: ["./form-dialog-wrapper.component.scss"],
})
export class FormDialogWrapperComponent implements AfterViewInit {
  readonly operationType = OperationType;

  /** entity to be edited */
  @Input() set entity(value: Entity) {
    this.originalEntity = Object.assign({}, value);
    this._entity = value;
  }
  get entity(): Entity {
    return this._entity;
  }

  /** actual reference to the entity to be edited in the form used by the getter/setter */
  private _entity: Entity;
  /** clone of the initially given entity as backup for resetting changes */
  private originalEntity: Entity;

  /**
   * (Optional) callback before saving the entity to the database.
   *
   * You can here do any prerequisites or editing of the entity object if required.
   * You can abort the saving by returning undefined.
   */
  @Input() beforeSave?: (entity: Entity) => Promise<Entity>;

  /**
   * Triggered when the form should be closed (after save or reset is completed).
   *
   * This emits the saved entity or undefined if the form was canceled.
   */
  @Output() onClose = new EventEmitter<Entity>();

  /** ngForm component of the child component that is set through the ng-content */
  @ContentChild("entityForm", { static: true }) contentForm;

  constructor(
    private entityMapper: EntityMapperService,
    private matDialogRef: MatDialogRef<any>,
    private router: Router,
    private snackBar: MatSnackBar,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngAfterViewInit() {
    this.contentForm.form.statusChanges.subscribe(() => {
      this.matDialogRef.disableClose = this.isFormDirty;
    });
  }

  /**
   * whether the contained form has been changed
   */
  public get isFormDirty(): boolean {
    return this.contentForm.form.dirty;
  }

  /**
   * Save the entity with the changes made in the current form.
   *
   * You can hook into the saving through the `beforeSave` Input.
   */
  public async save() {
    if (this.beforeSave) {
      const transformedEntity = await this.beforeSave(this.entity);
      if (!transformedEntity) {
        // abort saving
        return;
      }
      this.entity = transformedEntity;
    }

    await this.entityMapper.save<Entity>(this.entity);
    this.onClose.emit(this.entity);
  }

  /**
   * Reset any changes made to the entity in the current form (and trigger an `onClose` event).
   */
  public async cancel() {
    Object.assign(this._entity, this.originalEntity);
    this.onClose.emit(undefined);
  }

  public async delete() {
    const dialogRef = this.confirmationDialog.openDialog(
      "Delete?",
      "Are you sure you want to delete this object?"
    );

    dialogRef.afterClosed().subscribe(async (confirmed: any) => {
      const currentUrl = getUrlWithoutParams(this.router);
      if (confirmed) {
        await this.entityMapper.remove<Entity>(this.entity);
        this.onClose.emit(undefined);

        const snackBarRef = this.snackBar.open(
          $localize`:Deleted Entity information:Deleted Entity ${this.entity.toString()}`,
          "Undo",
          { duration: 8000 }
        );
        snackBarRef.onAction().subscribe(() => {
          this.entityMapper.save(this.entity, true);
          this.router.navigate([currentUrl]);
        });
      }
    });
  }
}
