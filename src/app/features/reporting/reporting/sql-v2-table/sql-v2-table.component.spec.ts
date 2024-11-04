import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SqlV2TableComponent } from "./sql-v2-table.component";

describe("SqlV2TableComponent", () => {
  let component: SqlV2TableComponent;
  let fixture: ComponentFixture<SqlV2TableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SqlV2TableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SqlV2TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
