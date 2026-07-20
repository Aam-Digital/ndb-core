/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Split a raw value into an array of individual values.
 * Supports JSON arrays and separator-delimited strings.
 * @param val The raw value to split
 * @param separator The separator character to use for splitting (default: ",")
 * @returns Array of individual string values
 */
export function splitArrayValue(val: any, separator: string = ","): string[] {
  if (val === null || val === undefined) {
    return [];
  }

  if (Array.isArray(val)) {
    return val;
  }

  if (typeof val !== "string") {
    return [String(val)];
  }

  val = val.trim();
  // Try parsing as JSON array first
  if (val.startsWith("[")) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Invalid JSON, fall through to separator-based parsing
    }
  }

  // Split by separator and trim whitespace
  return val
    .split(separator)
    .map((e) => e.trim())
    .filter((e) => e?.length > 0);
}
