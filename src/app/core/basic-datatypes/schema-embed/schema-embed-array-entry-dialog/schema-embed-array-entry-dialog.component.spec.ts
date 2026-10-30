import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import {
  SchemaEmbedArrayEntryDialogComponent,
  SchemaEmbedArrayEntryDialogData,
} from "./schema-embed-array-entry-dialog.component";
import { SchemaEmbedArrayEntryChange } from "../schema-embed-array-entry-change";

@DatabaseEntity("SchemaEmbedArrayEntryDialogTest")
class SchemaEmbedArrayEntryDialogTest extends Entity {}

const columns: FormFieldConfig[] = [
  {
    id: "documentType",
    dataType: "string",
    label: "Document Type",
    validators: { required: true },
  },
  { id: "documentNumber", dataType: "string", label: "Document Number" },
];

describe("SchemaEmbedArrayEntryDialogComponent", () => {
  let fixture: ComponentFixture<SchemaEmbedArrayEntryDialogComponent>;
  let component: SchemaEmbedArrayEntryDialogComponent;
  let entity: SchemaEmbedArrayEntryDialogTest;
  let mockDialogRef: {
    disableClose: boolean;
    backdropClick: () => Subject<MouseEvent>;
    close: ReturnType<typeof vi.fn>;
  };
  let backdropClick: Subject<MouseEvent>;
  let mockConfirmation: {
    getConfirmation: ReturnType<typeof vi.fn>;
    getDiscardConfirmation: ReturnType<typeof vi.fn>;
  };
  let entries: Record<string, any>[];
  let applyChange: ReturnType<typeof vi.fn>;

  async function createDialog(data: Partial<SchemaEmbedArrayEntryDialogData>) {
    await TestBed.configureTestingModule({
      imports: [
        SchemaEmbedArrayEntryDialogComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entries, entity, columns, applyChange, ...data },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaEmbedArrayEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function appliedChange(): SchemaEmbedArrayEntryChange {
    return applyChange.mock.lastCall[0];
  }

  function buttonTexts(): string[] {
    return Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll("mat-dialog-actions button"),
    ).map((b) => b.textContent.trim());
  }

  beforeEach(() => {
    backdropClick = new Subject();
    mockDialogRef = {
      disableClose: false,
      backdropClick: () => backdropClick,
      close: vi.fn(),
    };
    mockConfirmation = {
      getConfirmation: vi.fn().mockResolvedValue(true),
      getDiscardConfirmation: vi.fn().mockResolvedValue(true),
    };

    entity = new SchemaEmbedArrayEntryDialogTest();
    entries = [
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ];
    applyChange = vi.fn().mockResolvedValue(undefined);
  });

  it.each<[string, number | undefined]>([
    ["an edited entry", 1],
    ["a new entry", undefined],
  ])(
    "applies only the change of %s, together with the entry as it was when opened",
    async (_, index) => {
      await createDialog({ index });
      const original = index === undefined ? undefined : { ...entries[index] };

      component.form.setValue({ documentType: "Visa", documentNumber: "C3" });
      await component.save();

      const expected = {
        entry: { documentType: "Visa", documentNumber: "C3" },
        index,
        original,
      };
      expect(appliedChange()).toEqual(expected);
      expect(mockDialogRef.close).toHaveBeenCalledWith(expected);
    },
  );

  it.each([
    { name: "a new entry left empty", index: undefined, value: null, saved: 0 },
    {
      name: "a new entry with a value",
      index: undefined,
      value: "C3",
      saved: 1,
    },
    { name: "an existing entry cleared", index: 0, value: null, saved: 1 },
  ])(
    "adds no blank entry: $name is applied $saved time(s)",
    async ({ index, value, saved }) => {
      await createDialog({ index, columns: [columns[1]] });

      component.form.setValue({ documentNumber: value });
      await component.save();

      expect(applyChange).toHaveBeenCalledTimes(saved);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    },
  );

  it("does not natively submit the form (e.g. when pressing Enter in a field)", async () => {
    await createDialog({ index: 0 });

    const submit = new Event("submit", { cancelable: true });
    fixture.nativeElement.querySelector("form").dispatchEvent(submit);

    expect(submit.defaultPrevented).toBe(true);
  });

  it("starts with the values of the edited entry", async () => {
    await createDialog({ index: 1 });

    expect(component.form.getRawValue()).toEqual({
      documentType: "ID Card",
      documentNumber: "B2",
    });
  });

  it("does not save or close while an inner field is invalid", async () => {
    await createDialog({ index: undefined });

    component.form.setValue({ documentType: null, documentNumber: "C3" });
    await component.save();

    expect(applyChange).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it("stays open and shows the error if applying the change fails", async () => {
    applyChange.mockRejectedValue(new Error("save failed"));
    await createDialog({ index: 0 });
    const alertSpy = vi.spyOn(TestBed.inject(AlertService), "addDanger");

    await component.save();

    expect(alertSpy).toHaveBeenCalledWith("save failed");
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "removes the entry only if deletion is confirmed (%s)",
    async (confirmed) => {
      mockConfirmation.getConfirmation.mockResolvedValue(confirmed);
      await createDialog({ index: 0 });

      await component.delete();

      if (confirmed) {
        expect(appliedChange()).toEqual({
          delete: true,
          index: 0,
          original: { documentType: "Passport", documentNumber: "A1" },
        });
      } else {
        expect(applyChange).not.toHaveBeenCalled();
      }
    },
  );

  it.each<[string, Partial<SchemaEmbedArrayEntryDialogData>, string[]]>([
    ["an existing entry", { index: 0 }, ["Save", "Cancel", ""]],
    [
      "a new entry (nothing to delete)",
      { index: undefined },
      ["Save", "Cancel"],
    ],
    ["a read-only entry", { index: 0, readonly: true }, ["Cancel"]],
    [
      "an entry saved later with the surrounding form",
      { index: 0, deferSave: true },
      ["Apply", "Cancel", ""],
    ],
  ])("offers the matching actions for %s", async (_, data, expectedButtons) => {
    await createDialog(data);

    expect(buttonTexts()).toEqual(expectedButtons);
    expect(component.form.disabled).toBe(!!data.readonly);
  });

  it("asks before discarding changes when clicking outside the popup", async () => {
    mockConfirmation.getDiscardConfirmation.mockResolvedValue(false);
    await createDialog({ index: 0 });

    component.form.get("documentNumber").setValue("changed");
    component.form.markAsDirty();
    component.form.updateValueAndValidity();
    backdropClick.next(new MouseEvent("click"));
    await fixture.whenStable();

    expect(mockConfirmation.getDiscardConfirmation).toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
