import {
  Component,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnInit,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "../../../user/user";
import { SessionService } from "../../../session/session-service/session.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { LoggingService } from "../../../logging/logging.service";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

@UntilDestroy()
@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatSlideToggleModule, MatPaginatorModule],
  standalone: true,
})
export class ListPaginatorComponent<E>
  implements OnChanges, AfterViewInit, OnInit
{
  readonly pageSizeOptions = [10, 20, 50];
  readonly defaultPageSize = 10;

  @Input() dataSource: MatTableDataSource<E>;
  @Input() idForSavingPagination: string;

  @ViewChild("paginator") paginator: MatPaginator;

  user: User;
  pageSize = this.defaultPageSize;
  currentPageIndex = 0;
  showingAll = false;
  sizeBeforeToggling = this.defaultPageSize;

  constructor(
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("idForSavingPagination")) {
      this.applyUserPaginationSettings();
    }
  }

  ngOnInit() {
    this.dataSource
      .connect()
      .pipe(
        untilDestroyed(this),
        // When showingAll is false, nothing needs to be done -> filtered out
        filter(() => this.showingAll && !!this.paginator),
        filter((updatedDataSource) => updatedDataSource.length > 0)
      )
      .subscribe(() => {
        this.pageSize = this.dataSource.data.length;
        this.paginator.pageSize = this.dataSource.data.length;
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  onPaginateChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPageIndex = event.pageIndex;

    if (this.pageSize !== this.dataSource.data.length) {
      this.showingAll = false;
    }

    this.updateUserPaginationSettings();
  }

  changeAllToggle() {
    this.showingAll = !this.showingAll;

    if (this.showingAll) {
      this.sizeBeforeToggling = this.pageSize;
      this.pageSize = this.dataSource.data.length;
    } else {
      this.pageSize = this.sizeBeforeToggling;
    }
    this.paginator._changePageSize(this.pageSize);
    this.updateUserPaginationSettings();
  }

  private async applyUserPaginationSettings() {
    if (!(await this.ensureUserIsLoaded())) {
      return;
    }

    const pageSize =
      this.user.paginatorSettingsPageSize[this.idForSavingPagination];
    if (pageSize) {
      if (pageSize === -1) {
        this.pageSize = this.dataSource.data.length;
        this.showingAll = true;
      } else {
        this.pageSize = pageSize;
      }
      this.paginator._changePageSize(this.pageSize);
    }
    this.currentPageIndex =
      this.user.paginatorSettingsPageIndex[this.idForSavingPagination] ||
      this.currentPageIndex;
  }

  private async updateUserPaginationSettings() {
    if (!(await this.ensureUserIsLoaded())) {
      return;
    }

    // save "all" as -1
    const sizeToBeSaved = this.showingAll ? -1 : this.pageSize;

    // The page size is stored in the database, the page index is only in memory
    const hasChangesToBeSaved =
      sizeToBeSaved !==
      this.user.paginatorSettingsPageSize[this.idForSavingPagination];

    this.user.paginatorSettingsPageIndex[this.idForSavingPagination] =
      this.currentPageIndex;
    this.user.paginatorSettingsPageSize[this.idForSavingPagination] =
      sizeToBeSaved;

    if (hasChangesToBeSaved) {
      await this.entityMapperService.save<User>(this.user);
    }
  }

  private async ensureUserIsLoaded(): Promise<boolean> {
    if (!this.user) {
      const currentUser = this.sessionService.getCurrentUser();
      this.user = await this.entityMapperService
        .load(User, currentUser.name)
        .catch(() => undefined);
    }
    return !!this.user;
  }
}
