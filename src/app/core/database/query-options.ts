/**
 * Basic query options supported by {@link Database}
 */
export interface QueryOptions {
  key?: string;
  startkey?: string;
  endkey?: string;
  descending?: boolean;
  include_docs?: boolean;
  limit?: number;
  reduce?: boolean;
  group?: boolean;
  rev?: string;
}
