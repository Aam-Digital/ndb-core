import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { Entity } from "../../../entity/entity";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "app/core/user/user";
import { SessionService } from "app/core/session/session-service/session.service";
import { ViewChild } from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";


@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
})
export class ListPaginatorComponent<E extends Entity> {
  @Input() dataSource: MatTableDataSource<Entity>;

  @ViewChild(MatPaginator) paginator: MatPaginator;


  user: User;
  paginatorPageSize: number = 10;
  paginatorPageSizeBeforeToggle: number = 10;
  paginatorPageIndex: number = 0;
  showAllToggle: boolean = false;

  // This key is used to save the pagination settings on the user entity
  readonly paginatorKey: string;



  constructor(
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService
  ) {}

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
    // Use URl as key to save pagination settings
    this.paginatorPageSize =
      this.user.paginatorSettingsPageSize[this.paginatorKey] ||
      this.paginatorPageSize;
    this.paginatorPageIndex =
      this.user.paginatorSettingsPageIndex[this.paginatorKey] ||
      this.paginatorPageIndex;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.showAllToggle =
      this.paginatorPageSize >= this.dataSource.data.length;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    setTimeout(() => {
      this.paginator.pageIndex = this.paginatorPageIndex;
      this.paginator.page.next({
        pageIndex: this.paginator.pageIndex,
        pageSize: this.paginator.pageSize,
        length: this.paginator.length,
      });
    });
  }

  onPaginateChange(event: PageEvent) {
    this.paginatorPageSize = event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateUserPaginationSettings();
    this.showAllToggle =
      this.paginatorPageSize >= this.dataSource.data.length;
  }

  getPaginatorPageSizeOptions(): number[] {
    const ar = [3, 10, 20, 50].filter((n) => {
      return n < this.dataSource.data.length;
    });
    ar.push(this.dataSource.data.length);
    return ar;
  }

  getPaginatorPageSize(): number {
    if (
      this.dataSource.data.length &&
      this.paginatorPageSize >= this.dataSource.data.length
    ) {
      this.paginatorPageSize = this.dataSource.data.length;
    }
    return this.paginatorPageSize;
  }

  clickShowAllToggle() {
    if (!this.showAllToggle) {
      this.paginatorPageSizeBeforeToggle = this.paginatorPageSize;
      this.paginatorPageSize = this.dataSource.data.length;
    } else {
      if (
        this.paginatorPageSizeBeforeToggle <= this.dataSource.data.length
      ) {
        this.paginatorPageSize = this.paginatorPageSizeBeforeToggle;
      } else {
        const po = this.getPaginatorPageSizeOptions();
        this.paginatorPageSize = po.length > 2 ? po[po.length - 2] : po[0];
      }
    }
    this.paginator._changePageSize(this.paginatorPageSize);
    this.showAllToggle = !this.showAllToggle;
    this.updateUserPaginationSettings();
  }

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize[this.paginatorKey];

    this.user.paginatorSettingsPageIndex[
      this.paginatorKey
    ] = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize[
      this.paginatorKey
    ] = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }
  
}
