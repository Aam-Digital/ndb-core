import { ComponentTuple } from "#src/app/dynamic-components";

export const changeHistoryComponents: ComponentTuple[] = [
  [
    "ChangeHistoryActionBadge",
    () =>
      import("./change-history-action-badge/change-history-action-badge.component").then(
        (c) => c.ChangeHistoryActionBadgeComponent,
      ),
  ],
  [
    "ChangeHistoryChangedFields",
    () =>
      import("./change-history-changed-fields/change-history-changed-fields.component").then(
        (c) => c.ChangeHistoryChangedFieldsComponent,
      ),
  ],
  [
    "DisplayAuditTimestamp",
    () =>
      import("./display-audit-timestamp/display-audit-timestamp.component").then(
        (c) => c.DisplayAuditTimestampComponent,
      ),
  ],
  [
    "DisplayAuditRecord",
    () =>
      import("./display-audit-record/display-audit-record.component").then(
        (c) => c.DisplayAuditRecordComponent,
      ),
  ],
  [
    "DisplayAuditUser",
    () =>
      import("./display-audit-user/display-audit-user.component").then(
        (c) => c.DisplayAuditUserComponent,
      ),
  ],
];
