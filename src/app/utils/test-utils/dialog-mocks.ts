import { of } from "rxjs";
import type { Mock } from "vitest";

import { ConfirmationDialogService } from "../../core/common-components/confirmation-dialog/confirmation-dialog.service";

/**
 * Mocks for the dialog services, which are the most-mocked dependencies in the suite:
 * ConfirmationDialogService in 33 specs, MatDialog in 31, MatDialogRef in 23.
 *
 * Each was previously rebuilt by hand in every spec that needed it, and the same
 * `ConfirmationDialogMock` type was declared independently in four files. Beyond the
 * duplication, the hand-built versions are easy to get subtly wrong - `MatDialog.open()`
 * has to return something with an `afterClosed()` *observable*, and a mock that returns a
 * plain value fails somewhere far from the mistake.
 *
 * Use these where the default behaviour fits, and override the individual `vi.fn()` in the
 * test that cares:
 *
 *   const confirmation = mockConfirmationDialog();
 *   // ... { provide: ConfirmationDialogService, useValue: confirmation }
 *   confirmation.getConfirmation.mockResolvedValue(false);
 */

/**
 * Every prompt is optional except `getConfirmation`, so a spec that only needs that one can
 * still keep a hand-built `{ getConfirmation: vi.fn() }` - which matters because a bare
 * `vi.fn()` resolves undefined ("the user cancelled"), while {@link mockConfirmationDialog}
 * confirms by default. Those are different test setups, not two spellings of one.
 */
export type ConfirmationDialogMock = { getConfirmation: Mock } & Partial<
  Record<
    keyof Pick<
      ConfirmationDialogService,
      | "getConfirmationWithKeyword"
      | "getDiscardConfirmation"
      | "showProgressDialog"
    >,
    Mock
  >
>;

/**
 * A ConfirmationDialogService whose prompts all resolve the same way.
 *
 * @param confirmed what the user is taken to have answered (default: they confirm)
 */
export function mockConfirmationDialog(
  confirmed = true,
): ConfirmationDialogMock {
  return {
    getConfirmation: vi.fn().mockResolvedValue(confirmed),
    getConfirmationWithKeyword: vi.fn().mockResolvedValue(confirmed),
    getDiscardConfirmation: vi.fn().mockResolvedValue(confirmed),
    showProgressDialog: vi.fn().mockReturnValue({ close: vi.fn() }),
  };
}

export type MatDialogMock = { open: Mock };

/**
 * A MatDialog whose `open()` returns a ref that closes with `result`.
 *
 * The dialog is never actually rendered, so this is about what the component does with the
 * result - assert on `.open` for what was opened with which data.
 *
 * @param result the value `afterClosed()` emits (default: closed without a result)
 */
export function mockMatDialog(result: unknown = undefined): MatDialogMock {
  return {
    open: vi.fn().mockReturnValue(mockMatDialogRef(result)),
  };
}

export type MatDialogRefMock = {
  close: Mock;
  afterClosed: Mock;
  updateSize: Mock;
  updatePosition: Mock;
};

/**
 * A MatDialogRef, for the component *inside* a dialog rather than the one opening it.
 *
 * @param result the value `afterClosed()` emits (default: closed without a result)
 */
export function mockMatDialogRef(
  result: unknown = undefined,
): MatDialogRefMock {
  return {
    close: vi.fn(),
    afterClosed: vi.fn().mockReturnValue(of(result)),
    updateSize: vi.fn(),
    updatePosition: vi.fn(),
  };
}

export type MatSnackBarMock = { open: Mock; dismiss: Mock };

/**
 * A MatSnackBar whose `open()` returns a ref with no action taken.
 *
 * Override `open`'s return value where the test needs the user to press the action button:
 * `snackBar.open.mockReturnValue({ onAction: () => of(undefined), dismiss: vi.fn() })`
 */
export function mockMatSnackBar(): MatSnackBarMock {
  return {
    open: vi.fn().mockReturnValue({
      onAction: () => of(),
      afterDismissed: () => of({ dismissedByAction: false }),
      dismiss: vi.fn(),
    }),
    dismiss: vi.fn(),
  };
}
