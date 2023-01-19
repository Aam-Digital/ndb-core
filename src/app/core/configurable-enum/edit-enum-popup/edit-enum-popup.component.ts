import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { ConfigurableEnum } from "../configurable-enum";
import { MatListModule } from "@angular/material/list";
import { NgForOf } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from "@angular/cdk/drag-drop";

@Component({
  selector: "app-edit-enum-popup",
  templateUrl: "./edit-enum-popup.component.html",
  styleUrls: ["./edit-enum-popup.component.scss"],
  imports: [
    MatDialogModule,
    MatListModule,
    NgForOf,
    MatFormFieldModule,
    MatInputModule,
    DialogCloseComponent,
    MatButtonModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
  ],
  standalone: true,
})
export class EditEnumPopupComponent {
  // deep copy of enum array
  values = this.enumEntity.values.map((v) => Object.assign({}, v));
  private drops = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public enumEntity: ConfigurableEnum,
    private dialog: MatDialogRef<EditEnumPopupComponent>,
    private entityMapper: EntityMapperService
  ) {}

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.values, event.previousIndex, event.currentIndex);
    this.drops.push(event);
  }

  async save() {
    this.values.forEach(
      (v) =>
        (this.enumEntity.values.find(({ id }) => id === v.id).label = v.label)
    );
    this.drops.forEach((event) =>
      moveItemInArray(
        this.enumEntity.values,
        event.previousIndex,
        event.currentIndex
      )
    );
    await this.entityMapper.save(this.enumEntity);
    this.dialog.close();
  }
}
