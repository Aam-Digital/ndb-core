import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DashboardListWidgetComponent } from "./dashboard-list-widget.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { MatTableModule } from "@angular/material/table";

@Component({
  template: ` <app-dashboard-list-widget
    [entries]="entries"
    [entityType]="entityType"
    [dataMapper]="dataMapper"
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
});
