import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { Component } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

@Component({
  selector: "app-entity-component-select-component",
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    DialogCloseComponent,
  ],
  templateUrl: "./entity-component-select-component.html",
  styleUrl: "./entity-component-select-component.scss",
})
export class EntityComponentSelectComponent {
  options = [
    { value: "default-form", label: $localize`Default Section` },
    { value: "related-form", label: $localize`Related-Entity Section` },
  ];

  constructor(
    private dialogRef: MatDialogRef<EntityComponentSelectComponent>,
  ) {}

  selectSectionType(sectionType: string) {
    this.dialogRef.close(sectionType);
  }
}
