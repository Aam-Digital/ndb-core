import { inject, Injectable } from "@angular/core";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { Entity } from "../../core/entity/model/entity";
import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DefaultValueConfig } from "../../core/default-values/default-value-config";
import { FieldGroup } from "../../core/entity-details/form/field-group";
import { Params } from "@angular/router";

export interface PublicFormEntry {
  /**
   * Linked entity field configuration for the current entry.
   * Uses `additional` to denote the target entity type.
   */
  config: {
    linkedEntities?: FormFieldConfig[];
    columns?: FieldGroup[];
  };
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

    const linkedEntities = this.getLinkedEntitiesFromEntries(entries);

    if (linkedEntities.length === 0) {
      return;
    }

    // Only process configured linked entities for security
    const configuredParams = new Set(
      linkedEntities.map(({ linkedEntity }) => linkedEntity.id),
    );
    const ignoredParams: string[] = [];

    // Process configured parameters
    linkedEntities.forEach(({ columns, linkedEntity }) => {
      const paramValue = urlParams[linkedEntity.id];
      if (linkedEntity.id && paramValue && columns) {
        applyPrefillFn(
          columns,
          linkedEntity.id,
          { mode: "static", config: { value: paramValue } },
          linkedEntity.hideFromForm ?? true,
        );
      }
    });

    // Track ignored parameters for security warning
    Object.keys(urlParams).forEach((paramKey) => {
      if (!configuredParams.has(paramKey)) {
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
   * Extracts all linked entities from form entries.
   */
  private getLinkedEntitiesFromEntries(entries: PublicFormEntry[]): {
    columns: FieldGroup[];
    linkedEntity: FormFieldConfig;
  }[] {
    return entries.flatMap((entry) =>
      (entry.config.linkedEntities || [])
        .filter((entity) => entity?.id)
        .map((linkedEntity) => ({
          columns: entry.config.columns || [],
          linkedEntity,
        })),
    );
  }

  /**
   * Prefills linked entity fields across multiple form entries.
   *
   * - Matches by `linkedEntity.additional` (target entity type).
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
      linkedEntities.forEach((linkedEntity) => {
        if (!linkedEntity.id || !linkedEntity.additional) return;

        const targetEntity = entitiesByType.get(
          linkedEntity.additional.toLowerCase(),
        );
        if (!targetEntity) return;

        const targetId = targetEntity.getId();
        const control = entry.form.formGroup.get(linkedEntity.id);
        if (control && !control.value) {
          control.setValue(targetId);
          control.markAsDirty();
        }
        if (!entry.entity[linkedEntity.id]) {
          entry.entity[linkedEntity.id] = targetId;
        }
      });
    });
  }
}
