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
  @Input() dataSource: MatTableDataSource<E>;
  @Input() idForSavingPagination: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  user: User;
  paginatorPageSize = 10;
  paginatorPageSizeBeforeToggle = 10;
  paginatorPageSizeOptions = [3, 10, 20, 50];
  paginatorPageIndex = 0;
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
      this.paginatorPageSize =
        this.user.paginatorSettingsPageSize[this.idForSavingPagination] ||
        this.paginatorPageSize;
      this.paginatorPageIndex =
        this.user.paginatorSettingsPageIndex[this.idForSavingPagination] ||
        this.paginatorPageIndex;
    }
    if (changes.hasOwnProperty("dataSource")) {
      this.dataSource
        .connect()
        .pipe(
          untilDestroyed(this),
          filter((res) => res.length > 0)
        )
        .subscribe(() => {
          this.paginatorPageSize = Math.min(
            this.dataSource.data.length,
            this.paginatorPageSize
          );
          this.setPageSizeOptions();
          this.setPageSize();
          this.showingAll =
            this.paginatorPageSize >= this.dataSource.data.length;
          this.allToggleDisabled =
            this.dataSource.data.length <= this.paginatorPageSizeOptions[0];
        });
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  setPageSizeOptions() {
    const ar = [3, 10, 20, 50].filter((n) => {
      return n < this.dataSource.data.length;
    });
    this.paginatorPageSizeOptions = ar.concat(this.dataSource.data.length);
  }

  setPageSize() {
    if (this.paginatorPageSize >= this.dataSource.data.length) {
      this.paginatorPageSize = this.dataSource.data.length;
    }
  }

  onPaginateChange(event: PageEvent) {
    this.paginatorPageSize = event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateUserPaginationSettings();
  }

  changeAllToggle() {
    if (!this.showingAll) {
      this.paginatorPageSizeBeforeToggle = this.paginatorPageSize;
      this.paginatorPageSize = this.dataSource.data.length;
    } else if (
      this.paginatorPageSizeBeforeToggle <= this.dataSource.data.length
    ) {
      this.paginatorPageSize = this.paginatorPageSizeBeforeToggle;
    } else {
      const po = this.paginatorPageSizeOptions;
      this.paginatorPageSize = po.length > 2 ? po[po.length - 2] : po[0];
    }
    this.paginator._changePageSize(this.paginatorPageSize);
    this.updateUserPaginationSettings();
  }

  private updateUserPaginationSettings() {
    // The PageSize is stored in the database, the PageList is only in memory
    const hasChangesToBeSaved =
      this.paginatorPageSize !==
      this.user.paginatorSettingsPageSize[this.idForSavingPagination];

    this.user.paginatorSettingsPageIndex[
      this.idForSavingPagination
    ] = this.paginatorPageIndex;
    this.user.paginatorSettingsPageSize[
      this.idForSavingPagination
    ] = this.paginatorPageSize;

    if (hasChangesToBeSaved) {
      this.entityMapperService.save<User>(this.user);
    }
  }
}
