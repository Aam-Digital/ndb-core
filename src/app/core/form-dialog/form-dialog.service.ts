import { Injectable, inject } from "@angular/core";
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { Entity } from "../entity/model/entity";
import { RowDetailsComponent } from "./row-details/row-details.component";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../common-components/entity-form/FormConfig";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import {
  DialogViewComponent,
  DialogViewData,
} from "../ui/dialog-view/dialog-view.component";

@Injectable({ providedIn: "root" })
export class FormDialogService {
  private dialog = inject(MatDialog);
  private schemaService = inject(EntitySchemaService);

  static dialogSettings: MatDialogConfig = {
    width: "90%",
    maxWidth: "980px",
  };

  openView<E extends Entity>(entity: E, component: string = "EntityDetails") {
    return this.dialog.open(DialogViewComponent, {
      width: "99%",
      maxWidth: "95vw",
      maxHeight: "90vh",
      // EntityDetails with its multiple tabs needs an explicit height to not change size between tabs
      height: component === "EntityDetails" ? "85vh" : undefined,

      data: {
        component: component,
        entity: entity,
      } as DialogViewData,
    });
  }

  /**
   * Open a form in a popup that allows to edit the given entity.
   * @param entity
   * @param columnsOverall
   * @param component
   */
  openFormPopup<E extends Entity, T = RowDetailsComponent>(
    entity: E,
    columnsOverall?: ColumnConfig[],
    component: ComponentType<T> = RowDetailsComponent as ComponentType<T>,
  ): MatDialogRef<T> {
    if (!columnsOverall) {
      columnsOverall = FormDialogService.getSchemaFieldsForDetailsView(entity);
    }

    const columns: FormFieldConfig[] = this.inferFormFieldColumns(
      columnsOverall,
      entity,
    );

    const columnsToDisplay = columns
      .filter((col) => col.editComponent)
      .map((col) => Object.assign({}, col, { forTable: false }));

    return this.dialog.open(component, {
      ...FormDialogService.dialogSettings,
      data: {
        entity: entity,
        columns: columnsToDisplay,
        viewOnlyColumns: columns.filter((col) => !col.editComponent),
      },
    });
  }

  private inferFormFieldColumns(
    columnsOverall: ColumnConfig[],
    entity: Entity,
  ) {
    const columns = columnsOverall.map(toFormFieldConfig);

    for (const c of columns) {
      if (!c.editComponent) {
        c.editComponent = this.schemaService.getComponent(
          entity.getSchema().get(c.id),
          "edit",
        );
      }
    }

    return columns;
  }

  static getSchemaFieldsForDetailsView(entity: Entity): FormFieldConfig[] {
    let formFields: string[] = [];
    let isUsingShowFlag = false;

    for (const [key, field] of entity.getSchema()) {
      if (field.showInDetailsView) {
        formFields.push(key);
      }
      if (field.showInDetailsView !== undefined) {
        isUsingShowFlag = true;
      }
    }

    if (!isUsingShowFlag) {
      const excludedFields = Array.from(Entity.schema.keys());

      formFields = Array.from(entity.getSchema().keys()).filter(
        (k: string) => !excludedFields.includes(k),
      );
    }

    return formFields.map((k: string) => ({ id: k }));
  }
}
