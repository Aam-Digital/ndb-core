import { Component, computed, inject, input } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatDialog } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminEntityService } from "#src/app/core/admin/admin-entity.service";
import {
  AdminEntityFieldComponent,
  AdminEntityFieldData,
} from "#src/app/core/admin/admin-entity-details/admin-entity-field/admin-entity-field.component";
import { IconButtonComponent } from "#src/app/core/common-components/icon-button/icon-button.component";
import type { EmbeddedArrayDataConfig } from "#src/app/core/entity-details/embedded-array-data/embedded-array-data.component";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { resolveLocaleText } from "#src/app/core/language/active-locale";

/**
 * Admin UI to configure an "EmbeddedArrayData" section of a details view,
 * which displays the entries of a `schema-embed-array` field as a table.
 *
 * For now, this only offers to edit the field's schema.
 */
@Component({
  selector: "app-admin-embedded-array-data",
  imports: [IconButtonComponent, MatTooltipModule],
  template: `
    @if (field(); as field) {
      <app-icon-button
        icon="edit"
        (buttonClick)="openFieldConfig()"
        matTooltip="Edit the settings of the field displayed in this section."
        i18n-matTooltip
        i18n
      >
        Configure field "{{ field.label }}"
      </app-icon-button>
    } @else {
      <p class="hint-text" i18n>
        The field "{{ config()?.property }}" displayed in this section does not
        exist.
      </p>
    }
  `,
})
export class AdminEmbeddedArrayDataComponent {
  private readonly dialog = inject(MatDialog);
  private readonly adminEntityService = inject(AdminEntityService);
  // every (void) event must count as a change, so that it recomputes the dependent signals
  private readonly schemaUpdated = toSignal(
    this.adminEntityService.entitySchemaUpdated,
    { equal: () => false },
  );

  /** config of the section */
  config = input.required<EmbeddedArrayDataConfig>();

  /** the entity type whose details view holds this section */
  entityType = input.required<EntityConstructor>();

  /** the field displayed by this section, if it exists in the entity type's schema */
  field = computed<{ id: string; label: string } | undefined>(() => {
    this.schemaUpdated(); // the label can change through the "configure field" dialog
    const id = this.config()?.property;
    const schemaField = id ? this.entityType().schema.get(id) : undefined;
    if (!schemaField) {
      return undefined;
    }
    return { id, label: resolveLocaleText(schemaField.label) || id };
  });

  /**
   * Open the dialog to edit the schema of the field displayed by this section
   * and update the entity type's schema with the result
   * (saved together with the entity's config).
   */
  openFieldConfig(): void {
    const field = this.field();
    if (!field) {
      return;
    }

    const dialogRef = this.dialog.open(AdminEntityFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        entitySchemaField: {
          ...this.entityType().schema.get(field.id),
          id: field.id,
        },
        entityType: this.entityType(),
        overwriteLocally: false,
      } as AdminEntityFieldData,
    });

    dialogRef
      .afterClosed()
      .subscribe((updatedField: EntitySchemaField | undefined) => {
        if (!updatedField || typeof updatedField !== "object") {
          return;
        }
        this.adminEntityService.updateSchemaField(
          this.entityType(),
          updatedField.id,
          updatedField,
        );
      });
  }
}
