import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormField, MatOption, MatSelect } from "@angular/material/select";
import { EntityConstructor } from "app/core/entity/model/entity";

export interface AffectedEntity {
  id: string;
  name: string;
  currentStatus: string;
  newStatus: string;
  allStatuses: string[];
  targetField: string;
  targetEntityType: EntityConstructor;
}

@Component({
  selector: "app-automated-status-update",
  imports: [
    CommonModule,
    MatDialogActions,
    MatSelect,
    MatOption,
    MatDialogContent,
    ReactiveFormsModule,
    MatFormField,
    FormsModule,
  ],
  templateUrl: "./automated-status-update.component.html",
  styleUrl: "./automated-status-update.component.scss",
})
export class AutomatedUpdateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AutomatedUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entities: AffectedEntity[] },
  ) {
    console.log(data);
  }

  onConfirm(): void {
    this.dialogRef.close(this.data.entities);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
