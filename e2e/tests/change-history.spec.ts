import { argosScreenshot, expect, loadApp, test } from "#e2e/fixtures.js";
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { createEntityOfType } from "#src/app/core/demo-data/create-entity-of-type.js";

const CHANGE_LOG_CHILD = "<CHANGE LOG CHILD>";
const CHANGE_LOG_SCHOOL = "Change Log School";
/** id of an audit record whose entity no longer exists, i.e. a deleted record */
const DELETED_RECORD_ID = "Child:cl-gone";
const OTHER_AUTHOR = "priya";

/** The conditions of the change log's Mango query this stub needs to honour. */
interface StubSelector {
  operation?: string | { $ne?: string };
  entityId?: { $gte?: string };
  /**
   * The author is matched on either recorded field: the backend writes
   * `user.name` only when the access token carried one.
   */
  $or?: { "user.name"?: string; "user.id"?: string }[];
  /** the filter bar puts each selection in its own branch */
  $and?: StubSelector[];
}

/** The subset of the change log's Mango query this stub needs to honour. */
interface StubMangoQuery {
  selector?: StubSelector;
  limit?: number;
}

interface StubAuditDoc {
  _id: string;
  entityId: string;
  operation: "create" | "update" | "delete";
  timestamp: string;
  user: { name: string };
  diff?: unknown;
}

/**
 * What the stubbed audit database holds, newest last.
 *
 * The third record is a deletion of an entity that is not in the demo data,
 * which is the case the per-record history cannot cover: its details view is
 * gone, so the log is the only place that change is still visible.
 */
const AUDIT_DOCS: StubAuditDoc[] = [
  {
    _id: "AuditRecord:Child:cl-gone:2026-06-01T10:00:00.000Z:3-c",
    entityId: DELETED_RECORD_ID,
    operation: "delete",
    timestamp: "2026-06-01T10:00:00.000Z",
    user: { name: "demo-admin" },
  },
  {
    _id: "AuditRecord:School:cl-school:2026-06-02T10:00:00.000Z:2-b",
    entityId: "School:cl-school",
    operation: "update",
    timestamp: "2026-06-02T10:00:00.000Z",
    user: { name: OTHER_AUTHOR },
    diff: { name: ["Old name", CHANGE_LOG_SCHOOL] },
  },
  {
    _id: "AuditRecord:Child:cl-1:2026-06-03T10:00:00.000Z:2-a",
    entityId: "Child:cl-1",
    operation: "update",
    timestamp: "2026-06-03T10:00:00.000Z",
    user: { name: "demo-admin" },
    diff: { phone: ["0123", "0456"] },
  },
];

/**
 * Stand in for the replication-backend's audit database, which the
 * browser-local e2e setup has no equivalent of (same approach as the
 * template-export test takes for its own feature endpoint).
 *
 * `_find` applies the query's selector, sort and paging itself rather than
 * returning a fixed list, so a filter the screen sends is actually reflected in
 * what comes back — otherwise the filter assertions below would pass even if
 * the screen never sent the filter at all.
 */
/**
 * Collapse a selector's `$and` branches into one object of conditions.
 *
 * The filter bar combines each selection into its own branch, so the conditions
 * this stub matches on are nested rather than top-level. A later branch wins
 * over an earlier one on the same field, as it does in the database.
 */
function flattenSelector(selector: StubSelector): StubSelector {
  const flat: StubSelector = {};
  const visit = ({ $and, ...conditions }: StubSelector) => {
    Object.assign(flat, conditions);
    $and?.forEach(visit);
  };
  visit(selector);
  return flat;
}

async function stubAuditBackend(page: Parameters<typeof loadApp>[0]) {
  await page.route("**/db/_features", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ audit: { enabled: true } }),
    }),
  );

  // the change log creates its sort index on demand before querying
  await page.route("**/db/app-audit/_index", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: "created" }),
    }),
  );

  await page.route("**/db/app-audit/_find", (route) => {
    const query = route.request().postDataJSON() as StubMangoQuery;
    const selector = flattenSelector(query.selector ?? {});

    const matched = AUDIT_DOCS.filter((doc) => {
      const operation = selector.operation;
      if (typeof operation === "string") {
        if (doc.operation !== operation) {
          return false;
        }
      } else if (operation?.$ne && doc.operation === operation.$ne) {
        return false;
      }
      const idPrefix = selector.entityId?.$gte;
      if (idPrefix && !doc.entityId.startsWith(idPrefix)) {
        return false;
      }
      // the author filter offers every shape the backend may have recorded,
      // so any one of the branches matching is enough
      const authors = selector.$or;
      if (
        authors?.length &&
        !authors.some(
          (branch) =>
            branch["user.name"] === doc.user.name ||
            branch["user.id"] === doc.user.name,
        )
      ) {
        return false;
      }
      return true;
    });

    const newestFirst = [...matched].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    // the list pages by cursor, so it asks for a page at a time rather than
    // by position; this stub holds too few records for a second page
    const docs = newestFirst.slice(0, query.limit ?? matched.length);

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ docs, bookmark: "stub-end" }),
    });
  });
}

test("Change Log lists changes across records and narrows them by author", async ({
  page,
}) => {
  await stubAuditBackend(page);

  // the author filter offers the records a login account can belong to, so the
  // author of the change filtered for below has to be one of them
  const otherAuthor = createEntityOfType("User", OTHER_AUTHOR);
  otherAuthor["name"] = OTHER_AUTHOR;
  const users = [...generateUsers(), otherAuthor];
  const child = generateChild({ id: "cl-1", name: CHANGE_LOG_CHILD });
  const school = createEntityOfType("School", "cl-school");
  school["name"] = CHANGE_LOG_SCHOOL;

  await loadApp(page, [...users, child, school]);

  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByRole("navigation").getByText("Admin Overview").click();

  // the entry sits in the "Export and Backups" section, which is only one of
  // the accordion's panels and may not be the one currently open
  const changeLogLink = page.getByText("Change Log", { exact: true });
  if (!(await changeLogLink.isVisible())) {
    await page.getByRole("button", { name: /Export and Backups/ }).click();
  }
  await changeLogLink.click();

  await expect(page.getByRole("heading", { name: "Change Log" })).toBeVisible();

  // records that still exist are shown by name, not by their raw id
  await expect(
    page.getByRole("cell", { name: CHANGE_LOG_CHILD }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: CHANGE_LOG_SCHOOL }),
  ).toBeVisible();

  // the deleted record has no name left to show, so it is identified by the id
  // the change log keeps, and reports the removal instead of changed fields
  const deletedRow = page
    .getByRole("row")
    .filter({ hasText: DELETED_RECORD_ID });
  await expect(deletedRow.getByText("Deleted")).toBeVisible();
  await expect(deletedRow.getByText("record removed")).toBeVisible();

  await argosScreenshot(page, "change-log");

  // filtering by author leaves only that author's change
  await page.getByRole("textbox", { name: "Changed by" }).click();
  await page.getByRole("option", { name: OTHER_AUTHOR }).click();

  await expect(
    page.getByRole("cell", { name: CHANGE_LOG_SCHOOL }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: CHANGE_LOG_CHILD })).toHaveCount(
    0,
  );

  // clearing it brings the other records back
  await page.getByRole("button", { name: "Clear", exact: true }).click();

  await expect(
    page.getByRole("cell", { name: CHANGE_LOG_CHILD }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: CHANGE_LOG_SCHOOL }),
  ).toBeVisible();
});

const HISTORY_CHILD_NAME = "<CHANGE HISTORY CHILD>";

test("Change log of a single record is reachable from the entity actions menu", async ({
  page,
}) => {
  const users = generateUsers();
  const child = generateChild({ name: HISTORY_CHILD_NAME });

  await loadApp(page, [...users, child]);

  await page.getByRole("navigation").getByText("Children").click();
  await page.getByRole("cell", { name: HISTORY_CHILD_NAME }).click();

  // the entry point is offered to every user, not only those who may read the
  // audit data - the dialog itself explains why there is nothing to show
  await page.getByRole("button", { name: /more actions/i }).click();
  await page.getByRole("menuitem", { name: /View change log/i }).click();

  const dialog = page.getByRole("dialog");
  // by level, as the dialog also has a "Change log" section heading below
  await expect(
    dialog.getByRole("heading", { level: 2, name: "Change Log" }),
  ).toBeVisible();

  // the record's internal id is offered for troubleshooting (copyable in one
  // click), which is the only handle on a record whose title says nothing
  await expect(dialog.getByText(child.getId())).toBeVisible();

  // the e2e app runs on the browser-local database with no replication-backend,
  // so the audit feature reports itself unavailable rather than erroring
  await expect(
    dialog.getByText("This feature is currently not enabled for your system."),
  ).toBeVisible();
});
