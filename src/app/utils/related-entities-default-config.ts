/**
 * This file centralizes default configuration values for specific RelatedEntitiesComponent.
 * It provides default `columns` for various entities,
 */

import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";
import { RelatedEntitiesComponentConfig } from "../core/entity-details/related-entity-config";

export const RELATED_ENTITIES_DEFAULT_CONFIGS: Record<
  string,
  { entityType: string; columns?: FormFieldConfig[] }
> = {
  NotesRelatedToEntity: {
    entityType: "Note",
    columns: [
      { id: "date", visibleFrom: "xs" },
      { id: "subject", visibleFrom: "xs" },
      { id: "text", visibleFrom: "md" },
      { id: "authors", visibleFrom: "md" },
      { id: "warningLevel", visibleFrom: "md" },
    ],
  },
  TodosRelatedToEntity: {
    entityType: "Todo",
    columns: [
      { id: "deadline" },
      { id: "subject" },
      { id: "startDate" },
      { id: "assignedTo" },
      { id: "description", visibleFrom: "xl" },
      { id: "repetitionInterval", visibleFrom: "xl" },
      { id: "relatedEntities", hideFromTable: true },
      { id: "completed", hideFromForm: true },
    ],
  },
};

export const RELATED_ENTITY_OVERRIDES: Record<
  string,
  RelatedEntitiesComponentConfig
> = {
  Aser: {
    entityType: "Aser",
    component: "RelatedEntities",
  },
  HealthCheck: {
    entityType: "HealthCheck",
    component: "RelatedEntities",
  },
  EducationalMaterial: {
    entityType: "EducationalMaterial",
    component: "RelatedEntitiesWithSummary",
  },
  HistoricalEntityData: {
    entityType: "HistoricalEntityData",
    component: "RelatedEntities",
    loaderMethod: "HistoricalDataService",
  },
  RecurringActivity: {
    entityType: "RecurringActivity",
    component: "RelatedEntities",
  },
  ChildSchoolOverview: {
    entityType: "ChildSchoolRelation",
    component: "RelatedTimePeriodEntities",
    single: true,
  },
};
