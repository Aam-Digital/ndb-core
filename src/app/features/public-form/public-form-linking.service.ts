import { inject, Injectable } from "@angular/core";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DefaultValueConfig } from "../../core/default-values/default-value-config";
import { FieldGroup } from "../../core/entity-details/form/field-group";
import { Params } from "@angular/router";

/**
 * Represents a single form entry in a public form submission.
 * Each entry corresponds to one entity type being created.
 */
export interface PublicFormEntry {
  config: {
    linkedEntities?: string[];
    linkedFromForm?: string[];
    columns?: FieldGroup[];
  };
  entityType: EntityConstructor;
  entity: Entity | null;
  form: EntityForm<Entity> | null;
}

/** Callback type for applying prefill values to form fields */
type ApplyPrefillFn = (
  fieldGroups: FieldGroup[],
  fieldId: string,
  defaultValue: DefaultValueConfig,
  hideFromForm?: boolean,
) => void;

/**
 * Handles public-form linking mechanics.
 *
 * Responsibilities:
 * - Prefilling form fields from URL query parameters
 * - Linking fields across multiple forms in a single submission
 *
 * Note: `PublicFormsService` handles discovery and URL generation for public forms,
 * while this service focuses on applying link values to form data.
 */
@Injectable({
  providedIn: "root",
})
export class PublicFormLinkingService {
  private readonly snackbar = inject(MatSnackBar);

  /**
   * Processes URL parameters to prefill linked entity fields.
   * Only processes parameters that match configured `linkedEntities` for security.
   *
   * @param entries - Array of form entries with their configurations
   * @param urlParams - URL query parameters from the route
   * @param applyPrefillFn - Callback to apply prefill values to field groups
   */
  handleUrlParameterLinking(
    entries: PublicFormEntry[],
    urlParams: Params,
    applyPrefillFn: ApplyPrefillFn,
  ): void {
    if (!Object.keys(urlParams).length) return;

    const linkedFieldIds = this.getLinkedFieldIds(entries);
    if (!linkedFieldIds.size) return;

    this.applyUrlParamPrefills(entries, urlParams, applyPrefillFn);
    this.warnIgnoredParams(urlParams, linkedFieldIds);
  }

  /**
   * Links fields from other forms within the same submission.
   * Uses field schema to determine target entity type and sets the field
   * to the matching entity's ID (only if currently empty).
   *
   * @param entries - Array of form entries with initialized entities and forms
   */
  applyLinkedFromForm(entries: PublicFormEntry[]): void {
    if (
      !entries.length ||
      entries.some((entry) => !entry.entity || !entry.form)
    )
      return;

    const entitiesByType = this.buildEntityTypeMap(entries);

    for (const entry of entries) {
      this.linkFieldsFromOtherForms(entry, entitiesByType);
    }
  }

  /**
   * Collects all configured linked field IDs from all form entries.
   */
  private getLinkedFieldIds(entries: PublicFormEntry[]): Set<string> {
    return new Set(
      entries
        .flatMap((entry) => entry.config.linkedEntities ?? [])
        .filter(Boolean),
    );
  }

  /**
   * Applies URL parameter values as prefills to matching linked fields.
   */
  private applyUrlParamPrefills(
    entries: PublicFormEntry[],
    urlParams: Params,
    applyPrefillFn: ApplyPrefillFn,
  ): void {
    for (const entry of entries) {
      if (!entry.config.columns) continue;

      for (const fieldId of entry.config.linkedEntities ?? []) {
        const paramValue = urlParams[fieldId];
        if (!fieldId || !paramValue) continue;

        applyPrefillFn(
          entry.config.columns,
          fieldId,
          { mode: "static", config: { value: paramValue } },
          true,
        );
      }
    }
  }

  /**
   * Shows a snackbar warning for URL parameters that were not applied.
   */
  private warnIgnoredParams(
    urlParams: Params,
    linkedFieldIds: Set<string>,
  ): void {
    const ignoredParams = Object.keys(urlParams).filter(
      (key) => !linkedFieldIds.has(key),
    );

    if (ignoredParams.length) {
      this.snackbar.open(
        $localize`Some URL parameters were ignored for security: ${ignoredParams.join(", ")}`,
        undefined,
        { duration: 5000 },
      );
    }
  }

  /**
   * Builds a map of entity type (lowercase) to entity instance.
   */
  private buildEntityTypeMap(entries: PublicFormEntry[]): Map<string, Entity> {
    const map = new Map<string, Entity>();

    for (const entry of entries) {
      if (!entry.entity) continue;
      const entityType = entry.entity
        .getConstructor()
        .ENTITY_TYPE.toLowerCase();
      map.set(entityType, entry.entity);
    }

    return map;
  }

  /**
   * Links fields in a single entry to entities from other forms.
   */
  private linkFieldsFromOtherForms(
    entry: PublicFormEntry,
    entitiesByType: Map<string, Entity>,
  ): void {
    if (!entry.entity || !entry.form) return;

    for (const fieldId of entry.config.linkedFromForm ?? []) {
      if (!fieldId) continue;

      const targetEntity = this.findTargetEntityForField(
        entry.entityType,
        fieldId,
        entitiesByType,
      );
      if (!targetEntity) continue;

      this.setFieldValue(entry, fieldId, targetEntity.getId());
    }
  }

  /**
   * Finds the target entity for a linked field based on its schema.
   */
  private findTargetEntityForField(
    entityType: EntityConstructor,
    fieldId: string,
    entitiesByType: Map<string, Entity>,
  ): Entity | undefined {
    const fieldSchema = entityType.schema.get(fieldId);
    if (!fieldSchema?.additional) return undefined;

    return entitiesByType.get(fieldSchema.additional.toLowerCase());
  }

  /**
   * Sets a field value on both the form control and entity model (if empty).
   */
  private setFieldValue(
    entry: PublicFormEntry,
    fieldId: string,
    value: string,
  ): void {
    const control = entry.form?.formGroup.get(fieldId);

    if (control && !control.value) {
      control.setValue(value);
      control.markAsDirty();
    }

    if (entry.entity && !entry.entity[fieldId]) {
      entry.entity[fieldId] = value;
    }
  }
}
