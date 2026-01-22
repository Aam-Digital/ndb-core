import { inject, Injectable } from "@angular/core";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DefaultValueConfig } from "../../core/default-values/default-value-config";
import { FieldGroup } from "../../core/entity-details/form/field-group";
import { Params } from "@angular/router";

export interface PublicFormEntry {
  config: {
    linkedEntities?: string[];
    columns?: FieldGroup[];
  };
  entityType: EntityConstructor;
  entity: Entity | null;
  form: EntityForm<Entity> | null;
}

@Injectable({
  providedIn: "root",
})
export class PublicFormLinkingService {
  private snackbar = inject(MatSnackBar);

  /**
   * Processes URL parameters to prefill linked entity fields from query params.
   * Only processes URL parameters that match configured linkedEntities for security.
   *
   * @param entries - Array of form entries with their configurations
   * @param urlParams - URL query parameters from the route
   * @param applyPrefillFn - Callback function to apply prefill values to field groups
   */
  handleUrlParameterLinking(
    entries: PublicFormEntry[],
    urlParams: Params,
    applyPrefillFn: (
      fieldGroups: FieldGroup[],
      fieldId: string,
      defaultValue: DefaultValueConfig,
      hideFromForm?: boolean,
    ) => void,
  ): void {
    if (Object.keys(urlParams).length === 0) {
      return;
    }

    const linkedFieldIds = this.getAllLinkedFieldIds(entries);

    if (linkedFieldIds.size === 0) {
      return;
    }

    const ignoredParams: string[] = [];

    // Process configured parameters
    entries.forEach((entry) => {
      const linkedEntities = entry.config.linkedEntities || [];
      linkedEntities.forEach((fieldId) => {
        const paramValue = urlParams[fieldId];
        if (fieldId && paramValue && entry.config.columns) {
          applyPrefillFn(
            entry.config.columns,
            fieldId,
            { mode: "static", config: { value: paramValue } },
            true,
          );
        }
      });
    });

    // Track ignored parameters for security warning
    Object.keys(urlParams).forEach((paramKey) => {
      if (!linkedFieldIds.has(paramKey)) {
        ignoredParams.push(paramKey);
      }
    });

    if (ignoredParams.length > 0) {
      this.snackbar.open(
        $localize`Some URL parameters were ignored for security: ${ignoredParams.join(", ")}`,
        undefined,
        { duration: 5000 },
      );
    }
  }

  /**
   * Extracts all linked entity field IDs from form entries.
   */
  private getAllLinkedFieldIds(entries: PublicFormEntry[]): Set<string> {
    const fieldIds = new Set<string>();
    entries.forEach((entry) => {
      (entry.config.linkedEntities || []).forEach((fieldId) => {
        if (fieldId) {
          fieldIds.add(fieldId);
        }
      });
    });
    return fieldIds;
  }

  /**
   * Prefills linked entity fields across multiple form entries.
   *
   * - Derives target entity type from field schema.
   * - Sets the field to the target entity ID only if it is empty.
   * - Updates both the entity model and the reactive form control.
   */
  applyLinkedEntitiesFromForms(entries: PublicFormEntry[]): void {
    if (
      !entries.length ||
      entries.some((entry) => !entry.entity || !entry.form)
    )
      return;

    const entitiesByType = new Map<string, Entity>();
    entries.forEach((entry) => {
      if (!entry.entity) return;
      entitiesByType.set(
        entry.entity.getConstructor().ENTITY_TYPE.toLowerCase(),
        entry.entity,
      );
    });

    entries.forEach((entry) => {
      if (!entry.entity || !entry.form) return;
      const linkedEntities = entry.config.linkedEntities || [];
      linkedEntities.forEach((fieldId) => {
        if (!fieldId) return;

        // Get the target entity type from the field schema
        const fieldSchema = entry.entityType.schema.get(fieldId);
        if (!fieldSchema?.additional) return;

        const targetEntity = entitiesByType.get(
          fieldSchema.additional.toLowerCase(),
        );
        if (!targetEntity) return;

        const targetId = targetEntity.getId();
        const control = entry.form.formGroup.get(fieldId);
        if (control && !control.value) {
          control.setValue(targetId);
          control.markAsDirty();
        }
        if (!entry.entity[fieldId]) {
          entry.entity[fieldId] = targetId;
        }
      });
    });
  }
}
