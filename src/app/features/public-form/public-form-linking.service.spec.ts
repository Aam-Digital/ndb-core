import { TestBed } from "@angular/core/testing";
import { PublicFormLinkingService } from "./public-form-linking.service";
import { PublicFormEntry } from "./public-form-linking.service";
import { Entity, EntityConstructor } from "../../core/entity/model/entity";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityForm } from "../../core/common-components/entity-form/entity-form";

describe("PublicFormLinkingService", () => {
  let service: PublicFormLinkingService;
  let snackbarSpy: jasmine.SpyObj<MatSnackBar>;

  class TestEntity extends Entity {
    static override ENTITY_TYPE = "Test";
    static override schema = new Map([
      ["name", {}],
      ["childId", { additional: "Child" }],
      ["schoolId", { additional: "School" }],
    ]);
  }

  class SchoolEntity extends Entity {
    static override ENTITY_TYPE = "School";
    static override schema = new Map([["name", {}]]);
  }

  class ChildEntity extends Entity {
    static override ENTITY_TYPE = "Child";
    static override schema = new Map([["school", { additional: "School" }]]);
  }

  beforeEach(() => {
    snackbarSpy = jasmine.createSpyObj("MatSnackBar", ["open"]);

    TestBed.configureTestingModule({
      providers: [
        PublicFormLinkingService,
        { provide: MatSnackBar, useValue: snackbarSpy },
      ],
    });

    service = TestBed.inject(PublicFormLinkingService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("handleUrlParameterLinking", () => {
    it("should not process URL parameters when none are provided", () => {
      const entries: PublicFormEntry[] = [
        {
          config: { linkedEntities: ["childId"], columns: [{ fields: [] }] },
          entityType: TestEntity,
          entity: null,
          form: null,
        },
      ];
      const applyPrefillSpy = jasmine.createSpy("applyPrefill");

      service.handleUrlParameterLinking(entries, {}, applyPrefillSpy);

      expect(applyPrefillSpy).not.toHaveBeenCalled();
      expect(snackbarSpy.open).not.toHaveBeenCalled();
    });

    it("should not process when no linkedEntities are configured", () => {
      const entries: PublicFormEntry[] = [
        {
          config: { columns: [{ fields: [] }] },
          entityType: TestEntity,
          entity: null,
          form: null,
        },
      ];
      const applyPrefillSpy = jasmine.createSpy("applyPrefill");

      service.handleUrlParameterLinking(
        entries,
        { childId: "Child:123" },
        applyPrefillSpy,
      );

      expect(applyPrefillSpy).not.toHaveBeenCalled();
    });

    it("should apply configured URL parameters", () => {
      const columns = [{ fields: [] }];
      const entries: PublicFormEntry[] = [
        {
          config: { linkedEntities: ["childId", "schoolId"], columns },
          entityType: TestEntity,
          entity: null,
          form: null,
        },
      ];
      const applyPrefillSpy = jasmine.createSpy("applyPrefill");

      service.handleUrlParameterLinking(
        entries,
        { childId: "Child:123", schoolId: "School:456" },
        applyPrefillSpy,
      );

      expect(applyPrefillSpy).toHaveBeenCalledTimes(2);
      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns,
        "childId",
        { mode: "static", config: { value: "Child:123" } },
        true,
      );
      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns,
        "schoolId",
        { mode: "static", config: { value: "School:456" } },
        true,
      );
    });

    it("should ignore URL parameters not in linkedEntities (security)", () => {
      const columns = [{ fields: [] }];
      const entries: PublicFormEntry[] = [
        {
          config: { linkedEntities: ["childId", "schoolId"], columns },
          entityType: TestEntity,
          entity: null,
          form: null,
        },
      ];
      const applyPrefillSpy = jasmine.createSpy("applyPrefill");

      service.handleUrlParameterLinking(
        entries,
        {
          childId: "Child:123",
          schoolId: "School:456",
          hackerId: "Hacker:malicious",
          adminId: "Admin:dangerous",
        },
        applyPrefillSpy,
      );

      // Only linked entities should be applied
      expect(applyPrefillSpy).toHaveBeenCalledTimes(2);
      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns,
        "childId",
        { mode: "static", config: { value: "Child:123" } },
        true,
      );
      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns,
        "schoolId",
        { mode: "static", config: { value: "School:456" } },
        true,
      );

      // Snackbar warning should be shown for ignored params
      expect(snackbarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining("hackerId, adminId"),
        undefined,
        { duration: 5000 },
      );
    });

    it("should handle multiple entries with different linkedEntities", () => {
      const columns1 = [{ fields: [] }];
      const columns2 = [{ fields: [] }];
      const entries: PublicFormEntry[] = [
        {
          config: { linkedEntities: ["childId"], columns: columns1 },
          entityType: TestEntity,
          entity: null,
          form: null,
        },
        {
          config: { linkedEntities: ["schoolId"], columns: columns2 },
          entityType: SchoolEntity,
          entity: null,
          form: null,
        },
      ];
      const applyPrefillSpy = jasmine.createSpy("applyPrefill");

      service.handleUrlParameterLinking(
        entries,
        { childId: "Child:123", schoolId: "School:456" },
        applyPrefillSpy,
      );

      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns1,
        "childId",
        { mode: "static", config: { value: "Child:123" } },
        true,
      );
      expect(applyPrefillSpy).toHaveBeenCalledWith(
        columns2,
        "schoolId",
        { mode: "static", config: { value: "School:456" } },
        true,
      );
    });
  });

  describe("applyLinkedFromForm", () => {
    function createMockForm(fields: string[]): EntityForm<Entity> {
      const formGroup = new FormGroup({});
      fields.forEach((field) =>
        formGroup.addControl(field, new FormControl(null)),
      );
      return { formGroup } as unknown as EntityForm<Entity>;
    }

    it("should not process when entries are empty or lack required data", () => {
      service.applyLinkedFromForm([]);
      expect().nothing();

      const entriesWithoutForm: PublicFormEntry[] = [
        {
          config: { linkedFromForm: ["school"] },
          entityType: ChildEntity,
          entity: null,
          form: null,
        },
      ];
      service.applyLinkedFromForm(entriesWithoutForm);
      expect().nothing();
    });

    it("should link fields to entities from other forms based on schema", () => {
      class ComplexEntity extends Entity {
        static override ENTITY_TYPE = "Complex";
        static override schema = new Map([
          ["school", { additional: "School" }],
          ["child", { additional: "Child" }],
        ]);
      }

      const schoolEntity = new SchoolEntity();
      const childEntity = new ChildEntity();
      const complexEntity = new ComplexEntity();
      const schoolForm = createMockForm(["name"]);
      const childForm = createMockForm(["name"]);
      const complexForm = createMockForm(["school", "child"]);

      const entries: PublicFormEntry[] = [
        {
          config: { columns: [{ fields: ["name"] }] },
          entityType: SchoolEntity,
          entity: schoolEntity,
          form: schoolForm,
        },
        {
          config: { columns: [{ fields: ["name"] }] },
          entityType: ChildEntity,
          entity: childEntity,
          form: childForm,
        },
        {
          config: {
            columns: [{ fields: ["school", "child"] }],
            linkedFromForm: ["school", "child"],
          },
          entityType: ComplexEntity as EntityConstructor,
          entity: complexEntity,
          form: complexForm,
        },
      ];

      service.applyLinkedFromForm(entries);

      expect(complexEntity["school"]).toBe(schoolEntity.getId());
      expect(complexEntity["child"]).toBe(childEntity.getId());
      expect(complexForm.formGroup.get("school")?.value).toBe(
        schoolEntity.getId(),
      );
      expect(complexForm.formGroup.get("child")?.value).toBe(
        childEntity.getId(),
      );
      expect(complexForm.formGroup.get("school")?.dirty).toBeTrue();
    });

    it("should not overwrite existing field values", () => {
      const schoolEntity = new SchoolEntity();
      const childEntity = new ChildEntity();
      childEntity["school"] = "ExistingSchool:999";
      const schoolForm = createMockForm(["name"]);
      const childForm = createMockForm(["school"]);
      (childForm.formGroup.get("school") as any)?.setValue(
        "ExistingSchool:999",
      );

      const entries: PublicFormEntry[] = [
        {
          config: { columns: [{ fields: ["name"] }] },
          entityType: SchoolEntity,
          entity: schoolEntity,
          form: schoolForm,
        },
        {
          config: {
            columns: [{ fields: ["school"] }],
            linkedFromForm: ["school"],
          },
          entityType: ChildEntity,
          entity: childEntity,
          form: childForm,
        },
      ];

      service.applyLinkedFromForm(entries);

      // Values should remain unchanged
      expect(childEntity["school"]).toBe("ExistingSchool:999");
      expect(childForm.formGroup.get("school")?.value).toBe(
        "ExistingSchool:999",
      );
    });

    it("should skip fields without matching schema", () => {
      const schoolEntity = new SchoolEntity();
      const childEntity = new ChildEntity();
      const childForm = createMockForm(["school", "nonExistent"]);

      const entries: PublicFormEntry[] = [
        {
          config: { columns: [{ fields: ["name"] }] },
          entityType: SchoolEntity,
          entity: schoolEntity,
          form: createMockForm(["name"]),
        },
        {
          config: {
            columns: [{ fields: ["school", "nonExistent"] }],
            linkedFromForm: ["school", "nonExistent"],
          },
          entityType: ChildEntity,
          entity: childEntity,
          form: childForm,
        },
      ];

      service.applyLinkedFromForm(entries);

      // Should link school successfully
      expect(childEntity["school"]).toBe(schoolEntity.getId());
      // Should not error on nonExistent field
      expect(childEntity["nonExistent"]).toBeUndefined();
    });

    it("should skip fields when target entity type not found", () => {
      class OrphanEntity extends Entity {
        static override ENTITY_TYPE = "Orphan";
        // References a non-existent entity type
        static override schema = new Map([
          ["missingLink", { additional: "NonExistent" }],
        ]);
      }

      const orphanEntity = new OrphanEntity();
      const orphanForm = createMockForm(["missingLink"]);

      const entries: PublicFormEntry[] = [
        {
          config: {
            columns: [{ fields: ["missingLink"] }],
            linkedFromForm: ["missingLink"],
          },
          entityType: OrphanEntity as EntityConstructor,
          entity: orphanEntity,
          form: orphanForm,
        },
      ];

      service.applyLinkedFromForm(entries);

      // Should not set value when target entity not found
      expect(orphanEntity["missingLink"]).toBeUndefined();
      expect(orphanForm.formGroup.get("missingLink")?.value).toBeNull();
    });
  });
});
