import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { DashboardListWidgetComponent } from "./dashboard-list-widget.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
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
  standalone: true,
})
export class DashboardWidgetTestComponent {
  entries: any[];
  entityType: string;
}

describe("DashboardListWidgetComponent", () => {
  let parentComponent: DashboardWidgetTestComponent;
  let fixture: ComponentFixture<DashboardWidgetTestComponent>;
  let component: DashboardListWidgetComponent<any>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockEntityUpdates: Subject<UpdatedEntity<any>>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType", "receiveUpdates"]);
    mockEntityUpdates = new Subject<UpdatedEntity<Note>>();
    mockEntityMapper.receiveUpdates.and.returnValue(mockEntityUpdates);

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

  it("should automatically switch loading state when entries come as input", fakeAsync(() => {
    const testEntries = [{ name: "x" }];
    expect(component.isLoading).toBeTrue();

    parentComponent.entries = testEntries;
    fixture.detectChanges();
    tick();

    expect(component.isLoading).toBeFalse();
  }));

  it("should load entities itself if entityType input is given", fakeAsync(() => {
    const testEntries = [
      Note.create(new Date("2022-01-01")),
      Note.create(new Date("2022-05-27")),
    ];
    mockEntityMapper.loadType.and.resolveTo(testEntries);

    parentComponent.entries = [{ name: "ignored direct entry" }];
    parentComponent.entityType = "Note";
    fixture.detectChanges();
    tick();

    expect(component.dataSource.data).toEqual(testEntries);
    expect(component.isLoading).toBeFalse();
  }));

  it("should update loaded entities using entity-mapper's receiveUpdates", fakeAsync(() => {
    const initialEntry = Note.create(new Date("2022-01-01"));
    mockEntityMapper.loadType.and.resolveTo([initialEntry]);
    parentComponent.entityType = "Note";
    component.ngOnInit();
    fixture.detectChanges();
    tick();

    const newEntity = Note.create(new Date());
    mockEntityUpdates.next({ type: "new", entity: newEntity });
    tick();

    expect(component.dataSource.data).toContain(newEntity);
    expect(component.dataSource.data).toContain(initialEntry);
    expect(component.dataSource.data.length).toBe(2);
  }));

  it("should filter and sort loaded entries using dataPipe", fakeAsync(() => {
    const testEntries = [
      Note.create(new Date("2021-06-01")), // expected second
      Note.create(new Date("2021-01-01")), // expected first
      Note.create(new Date("2022-05-27")), // expected filtered out
    ];
    mockEntityMapper.loadType.and.resolveTo(testEntries);
    component.dataMapper = (data) =>
      data
        .filter((x) => x.date.getFullYear() < 2022)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    parentComponent.entityType = "Note";
    fixture.detectChanges();
    tick();

    expect(component.dataSource.data).toEqual([testEntries[1], testEntries[0]]);
  }));
});
