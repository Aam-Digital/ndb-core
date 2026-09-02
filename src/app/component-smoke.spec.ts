import { Type } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from "@angular/material/snack-bar";

import { ComponentTuple } from "./dynamic-components";
import { MockedTestingModule } from "./utils/mocked-testing.module";

import { coreComponents } from "./core/core-components";
import { childrenComponents } from "./child-dev-project/children/children-components";
import { notesComponents } from "./child-dev-project/notes/notes-components";
import { attendanceComponents } from "./features/attendance/attendance-components";
import { conflictResolutionComponents } from "./features/conflict-resolution/conflict-resolution-components";
import { fileComponents } from "./features/file/file-components";
import { locationComponents } from "./features/location/location-components";
import { matchingEntitiesComponents } from "./features/matching-entities/matching-entities-components";
import { reportingComponents } from "./features/reporting/reporting-components";

import { AddressGpsLocationComponent } from "#src/app/features/location/address-gps-location/address-gps-location.component";
import { AdminConfigCleanupComponent } from "#src/app/core/admin/config-cleanup/admin-config-cleanup.component";
import { AdminDefaultValueDynamicComponent } from "#src/app/core/default-values/x-dynamic-placeholder/admin-default-value-dynamic/admin-default-value-dynamic.component";
import { AdminEntityTypesComponent } from "#src/app/core/admin/admin-entity-types/admin-entity-types.component";
import { AdminListManagerComponent } from "#src/app/core/admin/admin-list-manager/admin-list-manager.component";
import { AdminMenuComponent } from "#src/app/core/admin/admin-menu/admin-menu.component";
import { AdminPrimaryActionComponent } from "#src/app/core/admin/admin-primary-action/admin-primary-action.component";
import { AdvancedFeaturesComponent } from "#src/app/core/admin/advanced-features/advanced-features.component";
import { AnonymizeOptionsComponent } from "#src/app/core/admin/admin-entity-details/admin-entity-field/anonymize-options/anonymize-options.component";
import { AppComponent } from "#src/app/app.component";
import { AttendanceBlockComponent } from "#src/app/features/attendance/deprecated/attendance-block/attendance-block.component";
import { BetaFeatureComponent } from "#src/app/features/coming-soon/beta-feature/beta-feature.component";
import { ContextAwareAssistantComponent } from "#src/app/core/setup/context-aware-assistant/context-aware-assistant.component";
import { CustomFormLinkButtonComponent } from "#src/app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import { DashboardWidgetComponent } from "#src/app/core/dashboard/dashboard-widget/dashboard-widget.component";
import { DataPrivacyComponent } from "#src/app/core/admin/data-privacy/data-privacy.component";
import { DialogCloseComponent } from "#src/app/core/common-components/dialog-close/dialog-close.component";
import { DynamicEditComponent } from "#src/app/core/entity/entity-field-edit/dynamic-edit/dynamic-edit.component";
import { EditTodoCompletionComponent } from "#src/app/features/todos/todo-completion/edit-todo-completion/edit-todo-completion.component";
import { EmailTemplateSelectionDialogComponent } from "#src/app/features/email-client/email-template-selection-dialog/email-template-selection-dialog.component";
import { EntityArchivedInfoComponent } from "#src/app/core/entity-details/entity-archived-info/entity-archived-info.component";
import { EntityCreateButtonComponent } from "#src/app/core/common-components/entity-create-button/entity-create-button.component";
import { FeatureDisabledInfoComponent } from "#src/app/core/common-components/feature-disabled-info/feature-disabled-info.component";
import { FilterOverlayComponent } from "#src/app/core/filter/filter-overlay/filter-overlay.component";
import { GotoThirdPartySystemComponent } from "#src/app/features/third-party-authentication/goto-third-party-system/goto-third-party-system.component";
import { HelpButtonComponent } from "#src/app/core/common-components/help-button/help-button.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { ImagePopupComponent } from "#src/app/features/file/edit-photo/image-popup/image-popup.component";
import { ImportMatchExistingComponent } from "#src/app/core/import/update-existing/import-match-existing/import-match-existing.component";
import { InheritedValueButtonComponent } from "#src/app/features/inherited-field/inherited-value-button/inherited-value-button.component";
import { JsonEditorComponent } from "#src/app/core/admin/json-editor/json-editor.component";
import { NotificationComponent } from "#src/app/features/notification/notification.component";
import { PillComponent } from "#src/app/core/common-components/pill/pill.component";
import { PrimaryActionComponent } from "#src/app/core/ui/primary-action/primary-action.component";
import { ProfileComponent } from "#src/app/core/user/profile/profile.component";
import { ProgressComponent } from "#src/app/features/file/progress/progress.component";
import { ProgressDashboardSettingsComponent } from "#src/app/features/dashboard-widgets/progress-dashboard-widget/progress-dashboard-settings/progress-dashboard-settings.component";
import { ReportRowComponent } from "#src/app/features/reporting/reporting/report-row/report-row.component";
import { RollCallTabComponent } from "#src/app/features/attendance/add-day-attendance/roll-call/roll-call-tab/roll-call-tab.component";
import { RowDetailsComponent } from "#src/app/core/form-dialog/row-details/row-details.component";
import { SqlV2TableComponent } from "#src/app/features/reporting/reporting/sql-v2-table/sql-v2-table.component";
import { SubmissionSuccessComponent } from "#src/app/features/public-form/submission-success/submission-success.component";
import { SubscriptionInfoComponent } from "#src/app/core/admin/subscription-info/subscription-info.component";
import { TemplateTooltipComponent } from "#src/app/core/common-components/template-tooltip/template-tooltip.component";
import { TodosDashboardSettingsComponent } from "#src/app/features/todos/todos-dashboard-settings.component/todos-dashboard-settings.component";
import { ViewActionsComponent } from "#src/app/core/common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { WarningNotOptimizedForSmallScreenComponent } from "#src/app/core/common-components/warning-not-optimized-for-small-screen/warning-not-optimized-for-small-screen.component";
import { WidgetComponentSelectComponent } from "#src/app/core/admin/admin-entity-details/widget-component-select/widget-component-select.component";

/**
 * One sweep replacing the 89 spec files that only asserted `expect(component).toBeTruthy()`.
 *
 * Each of those files paid a full jsdom environment (~1.3s of CI) to construct one component.
 * Doing it in a single file costs that once, and covers more than the old files did: the
 * registry lookup itself is now checked, which nothing tested before.
 *
 * Not covered here: `AssistantDialogComponent`, which hits NG0919 when another spec file in
 * the same worker has already evaluated part of its import cycle. That is one of the seven
 * circular dependencies `npm run check-circular-deps` reports for the app itself, not a
 * problem with this sweep - add it back once the cycle is broken.
 *
 * Twelve components whose old spec carried real provider setup keep their own file instead:
 * they cannot be constructed from the bare providers below, and working out what they depend
 * on is the expensive part of writing a test for them. Those files say so at the top.
 *
 * A component belongs here only while it has no behaviour worth asserting. As soon as it
 * grows branching logic, give it its own spec that tests that logic - and drop it from here
 * if it no longer constructs with the bare providers below.
 */

/** Every component the config can name, from all feature modules' registration lists. */
const REGISTERED: ComponentTuple[] = [
  ...coreComponents,
  ...childrenComponents,
  ...notesComponents,
  ...attendanceComponents,
  ...conflictResolutionComponents,
  ...fileComponents,
  ...locationComponents,
  ...matchingEntitiesComponents,
  ...reportingComponents,
];

/**
 * Registered components that need more than the bare providers below to be constructed at
 * all - a `formControl`, an `entity`, a view config, a database. Constructing them with a
 * fabricated input would only prove that the fabrication was accepted, so they are swept
 * for registry resolution only and carry their own spec for their actual behaviour.
 */
const NEEDS_BESPOKE_SETUP = new Set([
  "AdminMatchingEntities",
  "AttendanceWeekDashboardSettings",
  "ConflictResolution",
  "EditAge",
  "EditAttendance",
  "EditBoolean",
  "EditConfigurableEnum",
  "EditDate",
  "EditDateFormat",
  "EditEmail",
  "EditEntityType",
  "EditFile",
  "EditJson",
  "EditLegacyAttendance",
  "EditLongText",
  "EditMonth",
  "EditNumber",
  "EditPhoto",
  "EditReportDefinition",
  "EditReportMode",
  "EditText",
  "EditTextWithAutocomplete",
  "EditUrl",
  "EntityList",
  "ImportantNotesDashboardSettings",
  "NotesDashboardSettings",
  "NotesRelatedToEntity",
  "ReadonlyFunction",
  "RelatedEntities",
  "RelatedEntitiesWithSummary",
  "RelatedTimePeriodEntities",
]);

/**
 * Components that are not registered for dynamic config lookup but still construct with
 * nothing but the app's real providers. Add a component here instead of creating a new
 * spec file for it; remove it once it has a spec that asserts real behaviour.
 */
const PLAIN_COMPONENTS: Type<unknown>[] = [
  AddressGpsLocationComponent,
  AdminConfigCleanupComponent,
  AdminDefaultValueDynamicComponent,
  AdminEntityTypesComponent,
  AdminListManagerComponent,
  AdminMenuComponent,
  AdminPrimaryActionComponent,
  AdvancedFeaturesComponent,
  AnonymizeOptionsComponent,
  AppComponent,
  AttendanceBlockComponent,
  BetaFeatureComponent,
  ContextAwareAssistantComponent,
  CustomFormLinkButtonComponent,
  DashboardWidgetComponent,
  DataPrivacyComponent,
  DialogCloseComponent,
  DynamicEditComponent,
  EditTodoCompletionComponent,
  EmailTemplateSelectionDialogComponent,
  EntityArchivedInfoComponent,
  EntityCreateButtonComponent,
  FeatureDisabledInfoComponent,
  FilterOverlayComponent,
  GotoThirdPartySystemComponent,
  HelpButtonComponent,
  HintBoxComponent,
  ImagePopupComponent,
  ImportMatchExistingComponent,
  InheritedValueButtonComponent,
  JsonEditorComponent,
  NotificationComponent,
  PillComponent,
  PrimaryActionComponent,
  ProfileComponent,
  ProgressComponent,
  ProgressDashboardSettingsComponent,
  ReportRowComponent,
  RollCallTabComponent,
  RowDetailsComponent,
  SqlV2TableComponent,
  SubmissionSuccessComponent,
  SubscriptionInfoComponent,
  TemplateTooltipComponent,
  TodosDashboardSettingsComponent,
  ViewActionsComponent,
  ViewTitleComponent,
  WarningNotOptimizedForSmallScreenComponent,
  WidgetComponentSelectComponent,
];

describe("dynamic component registry", () => {
  it.each(REGISTERED)(
    "resolves %s to a component class",
    async (_key, load) => {
      const component = await load();

      expect(typeof component).toBe("function");
    },
  );

  it("registers every component under a unique name", () => {
    const names = REGISTERED.map(([name]) => name);

    expect(new Set(names).size).toBe(names.length);
  });
});

describe("components construct with the app's real providers", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        // generic stand-ins so dialog and snack-bar components can be constructed
        { provide: MAT_DIALOG_DATA, useValue: {} },
        {
          provide: MatDialogRef,
          useValue: {
            close: vi.fn(),
            updateSize: vi.fn(),
            updatePosition: vi.fn(),
            afterClosed: () => ({ subscribe: vi.fn() }),
          },
        },
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: { dismiss: vi.fn() } },
      ],
    }).compileComponents();
  });

  const registered = REGISTERED.filter(
    ([name]) => !NEEDS_BESPOKE_SETUP.has(name),
  );

  it.each(registered)("%s", async (_key, load) => {
    const fixture = TestBed.createComponent(await load());
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it.each(PLAIN_COMPONENTS.map((c) => [c.name, c] as const))(
    "%s",
    (_name, component) => {
      const fixture = TestBed.createComponent(component);
      fixture.detectChanges();

      expect(fixture.componentInstance).toBeTruthy();
    },
  );
});
