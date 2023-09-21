import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User, UserSubject } from "../../../user/user";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";

@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
  imports: [MatPaginatorModule],
  standalone: true,
})
export class ListPaginatorComponent<E> implements OnChanges, OnInit {
  readonly pageSizeOptions = [10, 20, 50, 100];

  @Input() dataSource: MatTableDataSource<E>;
  @Input() idForSavingPagination: string;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  user: User;
  pageSize = 10;

  constructor(
    private userSubject: UserSubject,
    private entityMapperService: EntityMapperService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("idForSavingPagination")) {
      this.applyUserPaginationSettings();
    }
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
  }

  onPaginateChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.updateUserPaginationSettings();
  }

  private async applyUserPaginationSettings() {
    if (!(await this.ensureUserIsLoaded())) {
      return;
    }

    const savedSize =
      this.user?.paginatorSettingsPageSize[this.idForSavingPagination];
    this.pageSize = savedSize && savedSize !== -1 ? savedSize : this.pageSize;
  }

  private async updateUserPaginationSettings() {
    if (!(await this.ensureUserIsLoaded())) {
      return;
    }
    // The page size is stored in the database, the page index is only in memory
    const hasChangesToBeSaved =
      this.pageSize !==
      this.user.paginatorSettingsPageSize[this.idForSavingPagination];

    this.user.paginatorSettingsPageSize[this.idForSavingPagination] =
      this.pageSize;

    if (hasChangesToBeSaved) {
      await this.entityMapperService.save<User>(this.user);
    }
  }

  private async ensureUserIsLoaded(): Promise<boolean> {
    if (!this.user) {
      const currentUser = this.userSubject.value;
      this.user = await this.entityMapperService
        .load(User, currentUser.name)
        .catch(() => undefined);
    }
    return !!this.user;
  }
}
