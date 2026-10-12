import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { ConfirmationDialogService } from "#src/app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import {
  EmbeddedArrayEntryDialogComponent,
  EmbeddedArrayEntryDialogData,
} from "./embedded-array-entry-dialog.component";

@DatabaseEntity("EmbeddedArrayEntryDialogTest")
class EmbeddedArrayEntryDialogTest extends Entity {}
EmbeddedArrayEntryDialogTest.schema.set("documents", {
  dataType: "schema-embed-array",
  additional: {
    documentType: { dataType: "string", label: "Document Type" },
    documentNumber: { dataType: "string", label: "Document Number" },
  },
});

const columns: FormFieldConfig[] = [
  {
    id: "documentType",
    dataType: "string",
    label: "Document Type",
    validators: { required: true },
  },
  { id: "documentNumber", dataType: "string", label: "Document Number" },
];

describe("EmbeddedArrayEntryDialogComponent", () => {
  let fixture: ComponentFixture<EmbeddedArrayEntryDialogComponent>;
  let component: EmbeddedArrayEntryDialogComponent;
  let entity: EmbeddedArrayEntryDialogTest;
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
  let saveSpy: ReturnType<typeof vi.spyOn>;

  async function createDialog(data: Partial<EmbeddedArrayEntryDialogData>) {
    await TestBed.configureTestingModule({
      imports: [
        EmbeddedArrayEntryDialogComponent,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entity, property: "documents", columns, ...data },
        },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ConfirmationDialogService, useValue: mockConfirmation },
      ],
    }).compileComponents();

    saveSpy = vi.spyOn(TestBed.inject(EntityMapperService), "save");
    fixture = TestBed.createComponent(EmbeddedArrayEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function savedEntries(): Record<string, any>[] {
    return saveSpy.mock.lastCall[0]["documents"];
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

    entity = new EmbeddedArrayEntryDialogTest();
    entity["documents"] = [
      { documentType: "Passport", documentNumber: "A1" },
      { documentType: "ID Card", documentNumber: "B2" },
    ];
  });

  it.each<[string, number | undefined, Record<string, any>[]]>([
    [
      "replaces the edited entry",
      1,
      [
        { documentType: "Passport", documentNumber: "A1" },
        { documentType: "Visa", documentNumber: "C3" },
      ],
    ],
    [
      "appends a new entry",
      undefined,
      [
        { documentType: "Passport", documentNumber: "A1" },
        { documentType: "ID Card", documentNumber: "B2" },
        { documentType: "Visa", documentNumber: "C3" },
      ],
    ],
  ])(
    "%s when saving and closes with the saved entity",
    async (_, index, expected) => {
      await createDialog({ index });

      component.form.setValue({ documentType: "Visa", documentNumber: "C3" });
      await component.save();

      expect(savedEntries()).toEqual(expected);
      expect(mockDialogRef.close).toHaveBeenCalledWith(entity);
    },
  );

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

    expect(saveSpy).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it.each([
    [true, [{ documentType: "ID Card", documentNumber: "B2" }]],
    [false, undefined],
  ])(
    "removes the entry only if deletion is confirmed (%s)",
    async (confirmed, expected) => {
      mockConfirmation.getConfirmation.mockResolvedValue(confirmed);
      await createDialog({ index: 0 });

      await component.delete();

      if (expected) {
        expect(savedEntries()).toEqual(expected);
      } else {
        expect(saveSpy).not.toHaveBeenCalled();
      }
    },
  );

  it.each<[string, Partial<EmbeddedArrayEntryDialogData>, string[]]>([
    ["an existing entry", { index: 0 }, ["Save", "Cancel", ""]],
    [
      "a new entry (nothing to delete)",
      { index: undefined },
      ["Save", "Cancel"],
    ],
    ["a read-only entry", { index: 0, readonly: true }, ["Cancel"]],
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
