import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ConflictResolutionListComponent } from "./conflict-resolution-list.component";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CompareRevComponent } from "../compare-rev/compare-rev.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { MatPaginatorModule } from "@angular/material/paginator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Database } from "../../core/database/database";

describe("ConflictResolutionListComponent", () => {
  let component: ConflictResolutionListComponent;
  let fixture: ComponentFixture<ConflictResolutionListComponent>;

  let mockDatabase: jasmine.SpyObj<Database>;

  beforeEach(
    waitForAsync(() => {
      mockDatabase = jasmine.createSpyObj("mockDatabase", [
        "saveDatabaseIndex",
        "query",
      ]);
      mockDatabase.query.and.returnValue(
        Promise.resolve({ total_rows: 0, rows: [] })
      );

      TestBed.configureTestingModule({
        imports: [
          MatTableModule,
          MatPaginatorModule,
          MatTooltipModule,
          MatExpansionModule,
          FormsModule,
          NoopAnimationsModule,
        ],
        providers: [{ provide: Database, useValue: mockDatabase }],
        declarations: [CompareRevComponent, ConflictResolutionListComponent],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ConflictResolutionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create database index for querying conflicts", async () => {
    await component.ngAfterViewInit();

    expect(mockDatabase.saveDatabaseIndex).toHaveBeenCalled();
  });
});
