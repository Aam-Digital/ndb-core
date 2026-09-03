import { BASELINE_OPERATION } from "./change-history.types";

/**
 * The CouchDB map/reduce view that makes "which changes touched this record?"
 * answerable across the whole audit database.
 *
 * A Mango (`_find`) index cannot serve this: a JSON index stores a field's value
 * as one key, so an array of referenced ids indexes as a single array-valued key
 * and membership lookups never hit it. Only a map function can `emit()` once per
 * referenced id, which is what a view gives us.
 *
 * The map source is a plain string rather than a serialized TypeScript function
 * on purpose: a bundled `Function.prototype.toString()` changes whenever the
 * minifier picks different identifiers, which would make
 * `PouchDatabase.saveDatabaseIndex` see a "changed" view on every release and
 * rebuild the whole index. The spec evaluates this exact string, so it is still
 * covered by tests.
 */

/**
 * Emits `[referencedId, timestamp]` for every entity id an audit record touches.
 *
 * "Touches" is both directions: the changed record itself (`entityId`) and every
 * entity id appearing anywhere in the recorded `diff` — a `create` snapshot, or
 * an update delta, which carries the removed value alongside the added one, so a
 * reference that was taken away is found just as well as one that was added.
 *
 * {@link BASELINE_OPERATION} records are skipped, as they are in the log's other
 * query: a baseline is a snapshot rather than a change, and indexing its full
 * field list would report every record that merely *held* a reference at that
 * moment as having changed it — for a demo dataset, one child's participation in
 * hundreds of past events.
 *
 * The ids are matched syntactically (`Type:id`), since a view has no access to
 * the entity schema. That is deliberately permissive: a spurious key is only
 * ever dead weight in the index (nobody searches for `mailto:…`), while a missed
 * one would silently drop a real result. Entity types created through the admin
 * UI are camelCase (see `generateIdFromLabel`), so the type part must not be
 * restricted to PascalCase.
 *
 * A `delete` contributes only its own `entityId`: PouchDB pushes a tombstone
 * stripped of content, so the record's references are simply not in the diff.
 */
const AUDIT_REFERENCE_MAP = `function (doc) {
  if (!doc || !doc.timestamp || doc.operation === "${BASELINE_OPERATION}") {
    return;
  }

  // "Type:id" with no whitespace; the leading letter rules out ISO timestamps
  var ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]*:[^\\s]+$/;
  // URI schemes that match the pattern but are never entity references.
  // Keys are prefixed, as are those of "found" below, so that a lookup can
  // never hit an inherited Object.prototype member ("constructor:1" would
  // otherwise read as a known scheme and be dropped).
  var NON_ENTITY_SCHEMES = {
    $http: 1, $https: 1, $ftp: 1, $file: 1, $data: 1,
    $blob: 1, $mailto: 1, $tel: 1, $urn: 1, $ws: 1, $wss: 1
  };
  // guards against one pathological document (a large config, a data URI)
  // bloating the index or stalling the indexer
  var MAX_REFS = 500;
  var MAX_DEPTH = 12;
  var MAX_ID_LENGTH = 200;

  // keys are prefixed so that no value can collide with an Object.prototype member
  var found = {};
  var count = 0;

  function add(value) {
    if (count >= MAX_REFS) {
      return;
    }
    if (typeof value !== "string" || value.length > MAX_ID_LENGTH) {
      return;
    }
    if (!ID_PATTERN.test(value) || value.indexOf("//") >= 0) {
      return;
    }
    var scheme = value.substring(0, value.indexOf(":")).toLowerCase();
    if (NON_ENTITY_SCHEMES["$" + scheme]) {
      return;
    }
    if (!found["$" + value]) {
      found["$" + value] = true;
      count++;
    }
  }

  function walk(value, depth) {
    if (count >= MAX_REFS || depth > MAX_DEPTH) {
      return;
    }
    if (typeof value === "string") {
      add(value);
    } else if (value && typeof value === "object") {
      for (var key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          walk(value[key], depth + 1);
        }
      }
    }
  }

  add(doc.entityId);
  walk(doc.diff, 0);

  for (var id in found) {
    emit([id.substring(1), doc.timestamp]);
  }
}`;

/** design document id, without the `_design/` prefix */
export const AUDIT_REFERENCE_INDEX_ID = "audit-references";

/** the query name to pass to `Database.query()` */
export const AUDIT_REFERENCE_VIEW = `${AUDIT_REFERENCE_INDEX_ID}/by_reference`;

/**
 * A fresh copy of the design document to create in the audit database.
 *
 * Built per call rather than shared: `saveDatabaseIndex` stamps `aam_version`
 * and `_rev` onto whatever it is given, and a retained `_rev` from an earlier
 * attempt would make the next one conflict.
 */
export function buildAuditReferenceIndex() {
  return {
    _id: `_design/${AUDIT_REFERENCE_INDEX_ID}`,
    views: {
      by_reference: { map: AUDIT_REFERENCE_MAP },
    },
  };
}
