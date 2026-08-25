import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardListWidgetComponent } from "./dashboard-list-widget.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { MatTableModule } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";

@Component({
  template: ` <app-dashboard-list-widget
    [entries]="entries"
    [entityType]="entityType"
    [dataMapper]="dataMapper"
    [pageLoader]="pageLoader"
    [paginationPageSize]="paginationPageSize"
  >
    <table mat-table>
      <ng-container matColumnDef="name">
        <td *matCellDef="let x">
          {{ x.name }}
        </td>
      </ng-container>

      <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
    </table>
  </app-dashboard-list-widget>`,
  imports: [DashboardListWidgetComponent, MatTableModule],
})
export class DashboardWidgetTestComponent {
  entries: any[];
  entityType: string;
  dataMapper: (data: any[]) => any[];
  pageLoader: (skip: number, limit: number) => Promise<any[]>;
  paginationPageSize = 5;
}

describe("DashboardListWidgetComponent", () => {
  let parentComponent: DashboardWidgetTestComponent;
  let fixture: ComponentFixture<DashboardWidgetTestComponent>;
  let component: DashboardListWidgetComponent<any>;

  let mockEntityMapper: any;
  let mockEntityUpdates: Subject<UpdatedEntity<any>>;

  beforeEach(async () => {
    mockEntityMapper = {
      loadType: vi.fn(),
      receiveUpdates: vi.fn(),
    };
    mockEntityUpdates = new Subject<UpdatedEntity<Note>>();
    mockEntityMapper.receiveUpdates.mockReturnValue(mockEntityUpdates);

    await TestBed.configureTestingModule({
      imports: [DashboardWidgetTestComponent],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardWidgetTestComponent);
    parentComponent = fixture.componentInstance;
    component = fixture.debugElement.query(
      By.directive(DashboardListWidgetComponent),
    ).componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(parentComponent).toBeTruthy();
    expect(component).toBeTruthy();
  });

  it("should automatically switch loading state when entries come as input", async () => {
    vi.useFakeTimers();
    try {
      const testEntries = [{ name: "x" }];
      expect(component.isLoading()).toBe(true);

      parentComponent.entries = testEntries;
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should load entities itself if entityType input is given", async () => {
    vi.useFakeTimers();
    try {
      const testEntries = [
        Note.create(new Date("2022-01-01")),
        Note.create(new Date("2022-05-27")),
      ];
      mockEntityMapper.loadType.mockResolvedValue(testEntries);

      parentComponent.entries = [{ name: "ignored direct entry" }];
      parentComponent.entityType = "Note";
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.dataSource.data).toEqual(testEntries);
      expect(component.isLoading()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should update loaded entities using entity-mapper's receiveUpdates", async () => {
    vi.useFakeTimers();
    try {
      const initialEntry = Note.create(new Date("2022-01-01"));
      mockEntityMapper.loadType.mockResolvedValue([initialEntry]);
      parentComponent.entityType = "Note";
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      const newEntity = Note.create(new Date());
      mockEntityUpdates.next({ type: "new", entity: newEntity });
      await vi.advanceTimersByTimeAsync(0);

      expect(component.dataSource.data).toContain(newEntity);
      expect(component.dataSource.data).toContain(initialEntry);
      expect(component.dataSource.data.length).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should filter and sort loaded entries using dataPipe", async () => {
    vi.useFakeTimers();
    try {
      const testEntries = [
        Note.create(new Date("2021-06-01")), // expected second
        Note.create(new Date("2021-01-01")), // expected first
        Note.create(new Date("2022-05-27")), // expected filtered out
      ];
      mockEntityMapper.loadType.mockResolvedValue(testEntries);
      parentComponent.dataMapper = (data) =>
        data
          .filter((x) => x.date.getFullYear() < 2022)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

      parentComponent.entityType = "Note";
      fixture.detectChanges();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.dataSource.data).toEqual([
        testEntries[1],
        testEntries[0],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  describe("pageLoader", () => {
    function getPaginator(): MatPaginator {
      return fixture.debugElement.query(By.directive(MatPaginator))
        .componentInstance;
    }

    it("should load the first page via pageLoader on init", async () => {
      vi.useFakeTimers();
      try {
        const page = [{ name: "a" }, { name: "b" }];
        const pageLoader = vi.fn().mockResolvedValue(page);
        parentComponent.pageLoader = pageLoader;
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        // requests one more than the page size, to detect whether a further page exists
        expect(pageLoader).toHaveBeenCalledWith(0, 6);
        expect(component.dataSource.data).toEqual(page);
        expect(component.isLoading()).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should cap the shown page to paginationPageSize when a further page exists", async () => {
      vi.useFakeTimers();
      try {
        const sixItems = Array.from({ length: 6 }, (_, i) => ({
          name: `item-${i}`,
        }));
        const pageLoader = vi.fn().mockResolvedValue(sixItems);
        parentComponent.pageLoader = pageLoader;
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.dataSource.data).toEqual(sixItems.slice(0, 5));
        // skip(0) + shown(5) + one more full page's worth, since more data exists
        expect(getPaginator().length).toBe(10);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should fetch the next page with the correct skip when the paginator changes page", async () => {
      vi.useFakeTimers();
      try {
        const pageLoader = vi.fn().mockResolvedValue([{ name: "a" }]);
        parentComponent.pageLoader = pageLoader;
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        getPaginator().page.emit({
          pageIndex: 2,
          pageSize: 5,
          previousPageIndex: 0,
          length: 100,
        });
        await vi.advanceTimersByTimeAsync(0);

        expect(pageLoader).toHaveBeenLastCalledWith(10, 6);
      } finally {
        vi.useRealTimers();
      }
    });

    it("should not bind the paginator to dataSource (which would otherwise re-slice an already-paged array)", async () => {
      vi.useFakeTimers();
      try {
        parentComponent.pageLoader = vi.fn().mockResolvedValue([]);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(component.dataSource.paginator).toBeFalsy();
      } finally {
        vi.useRealTimers();
      }
    });

    it("should use pageLoader instead of entityType when both are set", async () => {
      vi.useFakeTimers();
      try {
        parentComponent.entityType = "Note";
        parentComponent.pageLoader = vi.fn().mockResolvedValue([]);
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(0);

        expect(mockEntityMapper.loadType).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
