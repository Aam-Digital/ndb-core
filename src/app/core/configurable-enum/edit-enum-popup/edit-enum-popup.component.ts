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
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { DialogCloseComponent } from "../../common-components/dialog-close/dialog-close.component";
import { MatButtonModule } from "@angular/material/button";
import { EntityMapperService } from "../../entity/entity-mapper.service";

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
    ReactiveFormsModule,
    DialogCloseComponent,
    MatButtonModule,
  ],
  standalone: true,
})
export class EditEnumPopupComponent {
  form = this.fb.array(this.enumEntity.values.map((v) => v.label));

  constructor(
    @Inject(MAT_DIALOG_DATA) public enumEntity: ConfigurableEnum,
    private dialog: MatDialogRef<EditEnumPopupComponent>,
    private fb: FormBuilder,
    private entityMapper: EntityMapperService
  ) {}

  async save() {
    this.enumEntity.values.forEach(
      (item, i) => (item.label = this.form.at(i).value)
    );
    await this.entityMapper.save(this.enumEntity);
    this.dialog.close();
  }
}
