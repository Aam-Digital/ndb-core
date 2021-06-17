import {
  Component,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { Entity } from "../../../entity/entity";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "app/core/user/user";
import { SessionService } from "app/core/session/session-service/session.service";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";

@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
})
export class ListPaginatorComponent<E extends Entity> implements OnChanges {
  @Input() dataSource: MatTableDataSource<E>;

  @Input() idForSavingPagination: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  user: User;
  paginatorPageSize: number = 10;
  paginatorPageSizeBeforeToggle: number = 10;
  paginatorPageSizeOptions: Array<number> = [3, 10, 20, 50];
  paginatorPageIndex: number = 0;
  allToggle: boolean = false;

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
    this.dataSource.connect().subscribe((res) => {
      this.allToggle = this.paginatorPageSize >= this.dataSource.data.length;
      if (res.length > 0) {
        this.paginatorPageSize = Math.min(
          this.dataSource.data.length,
          this.paginatorPageSize
        );
        this.setPageSizeOptions();
        this.setPageSize();
      }
    });
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
    this.allToggle = this.paginatorPageSize >= this.dataSource.data.length;
  }

  clickAllToggle() {
    if (!this.allToggle) {
      this.paginatorPageSizeBeforeToggle = this.paginatorPageSize;
      this.paginatorPageSize = this.dataSource.data.length;
    } else {
      if (this.paginatorPageSizeBeforeToggle <= this.dataSource.data.length) {
        this.paginatorPageSize = this.paginatorPageSizeBeforeToggle;
      } else {
        const po = this.paginatorPageSizeOptions;
        this.paginatorPageSize = po.length > 2 ? po[po.length - 2] : po[0];
      }
    }
    this.paginator._changePageSize(this.paginatorPageSize);
    this.allToggle = !this.allToggle;
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
