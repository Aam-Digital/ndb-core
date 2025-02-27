import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BulkMergeRecordsComponent } from "./bulk-merge-records.component";
import { Entity } from "app/core/entity/model/entity";

describe("BulkMergeRecordsComponent", () => {
  let component: BulkMergeRecordsComponent<Entity>;
  let fixture: ComponentFixture<BulkMergeRecordsComponent<Entity>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkMergeRecordsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BulkMergeRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
