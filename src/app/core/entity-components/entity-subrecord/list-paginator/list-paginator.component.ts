import {
  Component,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "../../../user/user";
import { SessionService } from "../../../session/session-service/session.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";

@UntilDestroy()
@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
})
export class ListPaginatorComponent<E extends Entity>
  implements OnChanges, AfterViewInit {
  readonly defaultSizeOptions = [10, 20, 50];
  readonly defaultPageSize = 10;

  @Input() dataSource: MatTableDataSource<E>;
  @Input() idForSavingPagination: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  user: User;
  pageSize = this.defaultPageSize;
  sizeBeforeToggling = this.defaultPageSize;
  sizeOptions = this.defaultSizeOptions;
  currentPageIndex = 0;
  showingAll = false;
  allToggleDisabled = false;

  constructor(
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService
  ) {
    this.user = this.sessionService.getCurrentUser();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("idForSavingPagination")) {
      this.applyUserPaginationSettings();
    }
    if (changes.hasOwnProperty("dataSource")) {
      this.dataSource
        .connect()
        .pipe(
          untilDestroyed(this),
          filter((res) => res.length > 0)
        )
        .subscribe(() => {
          if (
            !this.defaultSizeOptions.includes(this.pageSize) &&
            this.dataSource.data.length > this.defaultPageSize
          ) {
            this.pageSize = this.dataSource.data.length;
          }
          this.setPageSizeOptions();
          this.showingAll = this.pageSize >= this.dataSource.data.length;
          this.allToggleDisabled =
            this.dataSource.data.length <= this.defaultPageSize;
        });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  setPageSizeOptions() {
    const ar = this.defaultSizeOptions.filter((n) => {
      return n < this.dataSource.data.length;
    });
    this.sizeOptions = ar.concat(this.dataSource.data.length);
  }

  onPaginateChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;
    this.updateUserPaginationSettings();
  }

  changeAllToggle() {
    if (!this.showingAll) {
      this.sizeBeforeToggling = this.pageSize;
      this.pageSize = this.dataSource.data.length;
    } else if (this.sizeBeforeToggling <= this.dataSource.data.length) {
      this.pageSize = this.sizeBeforeToggling;
    } else {
      const po = this.sizeOptions;
      this.pageSize = po.length > 2 ? po[po.length - 2] : po[0];
    }
    this.paginator._changePageSize(this.pageSize);
    this.updateUserPaginationSettings();
  }

  private applyUserPaginationSettings() {
    const pageSize = this.user.paginatorSettingsPageSize[
      this.idForSavingPagination
    ];
    if (pageSize) {
      if (this.defaultSizeOptions.includes(pageSize)) {
        this.pageSize = pageSize;
      } else if (pageSize < this.defaultPageSize) {
        this.pageSize = this.defaultPageSize;
      } else {
        this.pageSize = this.dataSource.data.length;
      }
    }
    this.currentPageIndex =
      this.user.paginatorSettingsPageIndex[this.idForSavingPagination] ||
      this.currentPageIndex;
  }

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.pageSize !==
      this.user.paginatorSettingsPageSize[this.idForSavingPagination];

    this.user.paginatorSettingsPageIndex[
      this.idForSavingPagination
    ] = this.currentPageIndex;
    this.user.paginatorSettingsPageSize[
      this.idForSavingPagination
    ] = this.pageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }
}
