import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SqlV2TableComponent } from "./sql-v2-table.component";
import { CoreTestingModule } from "../../../../utils/core-testing.module";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";

describe("SqlV2TableComponent", () => {
  let component: SqlV2TableComponent;
  let fixture: ComponentFixture<SqlV2TableComponent>;
  let mockHttp: any;

  beforeEach(async () => {
    mockHttp = {
      get: vi.fn(),
    };
    mockHttp.get.mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [SqlV2TableComponent, CoreTestingModule],
      providers: [{ provide: HttpClient, useValue: mockHttp }],
    }).compileComponents();

    fixture = TestBed.createComponent(SqlV2TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
