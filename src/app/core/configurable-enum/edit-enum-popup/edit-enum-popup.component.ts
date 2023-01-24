import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { ConfigurableEnum } from "../configurable-enum";
import { NgForOf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ConfigurableEnumValue } from "../configurable-enum.interface";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

@Component({
  selector: "app-edit-enum-popup",
  templateUrl: "./edit-enum-popup.component.html",
  styleUrls: ["./edit-enum-popup.component.scss"],
  imports: [
    MatDialogModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    FormsModule,
    CdkDropList,
    CdkDrag,
    FontAwesomeModule,
    MatButtonModule,
  ],
  standalone: true,
})
export class EditEnumPopupComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public enumEntity: ConfigurableEnum,
    private dialog: MatDialogRef<EditEnumPopupComponent>,
    private entityMapper: EntityMapperService,
    private confirmationService: ConfirmationDialogService
  ) {
    this.dialog.afterClosed().subscribe((closeAndSave: boolean) => {
      if (closeAndSave) {
        this.entityMapper.save(this.enumEntity);
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.enumEntity.values,
      event.previousIndex,
      event.currentIndex
    );
  }

  async delete(value: ConfigurableEnumValue, index: number) {
    const confirmed = await this.confirmationService.getConfirmation(
      $localize`Delete option`,
      $localize`Are you sure that you want to delete the option ${value.label}?`
    );
    if (confirmed) {
      this.enumEntity.values.splice(index, 1);
      await this.entityMapper.save(this.enumEntity);
    }
  }
}
