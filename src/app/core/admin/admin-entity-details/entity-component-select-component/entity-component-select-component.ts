import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { PanelComponent } from "#src/app/core/entity-details/EntityDetailsConfig";
import { Component, Inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
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
  options: { label: string; value: PanelComponent }[];

  constructor(
    private dialogRef: MatDialogRef<
      EntityComponentSelectComponent,
      PanelComponent
    >,
    @Inject(MAT_DIALOG_DATA) data: { entityType: string },
  ) {
    this.options = [
      {
        label: $localize`Standard Section`,
        value: {
          title: $localize`:Default title:New Section`,
          component: "Form", // TODO: make this configurable
          config: { fieldGroups: [] },
        },
      },
      {
        label: $localize`Related-Entity Section`,
        value: {
          title: $localize`:Default title:New Related Section`,
          component: "RelatedEntities",
          config: {
            entityType: data.entityType, //we can not use empty string
          },
        },
      },
    ];
  }

  selectSectionType(opt: PanelComponent) {
    this.dialogRef.close(opt);
  }
}
