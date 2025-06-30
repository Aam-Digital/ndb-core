/**
 * This file centralizes default configuration values for specific RelatedEntitiesComponent.
 * It provides default `columns` for various entities,
 */

import { FormFieldConfig } from "app/core/common-components/entity-form/FormConfig";

export const ENTITY_DEFAULT_VALUES: Record<
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
  ActivitiesOverview: {
    entityType: "RecurringActivity",
    columns: [
      { id: "title" },
      { id: "type" },
      { id: "assignedTo" },
      { id: "linkedGroups" },
      { id: "excludedParticipants" },
    ],
  },
  ChildSchoolOverview: {
    entityType: "ChildSchoolRelation",
  },
};
