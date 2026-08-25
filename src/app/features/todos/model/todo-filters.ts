import { DataFilter } from "#src/app/core/filter/filters/filters";
import { Todo } from "./todo";

/**
 * Select Todo records that have not been completed.
 *
 * `TodoService.uncompleteTodo` resets `completed` to null instead of removing the property,
 * so records without the property and records holding null both have to be matched.
 * Each branch is an object (rather than a plain null value) so that the filter can also be
 * used as the initial filter of a list, where FilterService inspects it to prefill new records.
 */
export const TODO_NOT_COMPLETED_FILTER = {
  $or: [{ completed: { $exists: false } }, { completed: { $eq: null } }],
} as DataFilter<Todo>;

/**
 * Select Todo records that have been completed.
 */
export const TODO_COMPLETED_FILTER = {
  $and: [{ completed: { $exists: true } }, { completed: { $ne: null } }],
} as DataFilter<Todo>;
