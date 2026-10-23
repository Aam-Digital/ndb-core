import { EventEmitter } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { AdminEntityService } from "../admin-entity.service";
import { AdminListManagerComponent } from "./admin-list-manager.component";

describe("AdminListManagerComponent", () => {
  let fixture: ComponentFixture<AdminListManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminListManagerComponent,
        NoopAnimationsModule,
        MockedTestingModule.withState(),
      ],
      providers: [
        {
          provide: AdminEntityService,
          useValue: { entitySchemaUpdated: new EventEmitter<void>() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminListManagerComponent);
    fixture.componentRef.setInput("entityType", TestEntity);
    fixture.componentRef.setInput("items", ["other"]);
    fixture.componentRef.setInput("excludedFields", ["other", "dateOfBirth"]);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("keeps an already selected field that is also excluded when the selection changes", () => {
    const fieldSelect = fixture.debugElement.query(
      By.directive(EntityFieldSelectComponent),
    ).componentInstance as EntityFieldSelectComponent;
    const emittedIds: string[][] = [];
    fixture.componentInstance.idsChange.subscribe((ids) =>
      emittedIds.push(ids),
    );

    fieldSelect.autocompleteForm.setValue("");
    const offeredIds = fieldSelect.autocompleteOptions().map((o) => o.asValue);
    expect(offeredIds).not.toContain("dateOfBirth");

    fieldSelect.select(
      fieldSelect.autocompleteOptions().find((o) => o.asValue === "name"),
    );

    expect([...emittedIds.at(-1)].sort()).toEqual(["name", "other"]);
  });
});
