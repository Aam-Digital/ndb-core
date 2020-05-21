import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ConflictResolutionComponent } from "./conflict-resolution.component";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CompareRevComponent } from "../compare-rev/compare-rev.component";
import { MatExpansionModule } from "@angular/material/expansion";
import { FormsModule } from "@angular/forms";
import { MatPaginatorModule } from "@angular/material/paginator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Database } from "../../core/database/database";

describe("ConflictResolutionComponent", () => {
  let component: ConflictResolutionComponent;
  let fixture: ComponentFixture<ConflictResolutionComponent>;

  let mockDatabase: jasmine.SpyObj<Database>;

  beforeEach(async(() => {
    mockDatabase = jasmine.createSpyObj("mockDatabase", [
      "saveDatabaseIndex",
      "query",
    ]);

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
      declarations: [CompareRevComponent, ConflictResolutionComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConflictResolutionComponent);
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
