import { Entity } from "../../entity/model/entity";
import { DataFilter, Filter } from "./filters";
import { StringFilterComponent } from "../string-filter/string-filter.component";

/**
 * Escape all special regex characters so the given text
 * can be used as a literal search string inside a regular expression.
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A filter for free-text properties (dataType "string" or "long-text").
 *
 * The user enters text into a simple input field and all entities are matched
 * where the property *contains* this text (case-insensitive),
 * implemented as a `$regex` condition of the MongoDB query syntax.
 */
export class StringFilter<T extends Entity> extends Filter<T> {
  override component = StringFilterComponent;

  constructor(
    public override name: string,
    public override label: string = name,
  ) {
    super(name, label);
    this.selectedOptionValues = [];
  }

  /**
   * The current search text of this filter.
   * (URL parsing splits values at "," - join them back to restore the original text)
   */
  getSearchText(): string {
    return (this.selectedOptionValues ?? []).join(",");
  }

  getFilter(): DataFilter<T> {
    const searchText = this.getSearchText();
    if (!searchText.trim()) {
      return {} as DataFilter<T>;
    }

    return {
      [this.name]: {
        // escaped to match the text literally (also preventing invalid regex input errors)
        $regex: escapeRegExp(searchText),
        $options: "i",
      },
    } as DataFilter<T>;
  }
}
