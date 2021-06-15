import { Component, ViewChild, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity } from "../../../entity/entity";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { User } from "app/core/user/user";
import { SessionService } from "app/core/session/session-service/session.service";
import { EntityMapperService } from "app/core/entity/entity-mapper.service";
import { getUrlWithoutParams } from "app/utils/utils";
import { Router } from "@angular/router";


@Component({
  selector: "app-list-paginator",
  templateUrl: "./list-paginator.component.html",
  styleUrls: ["./list-paginator.component.scss"],
})
export class ListPaginatorComponent<E extends Entity> 
  implements OnChanges {
  @Input() dataSource: MatTableDataSource<E>;
  
  // Inputting the data separately from the dataSource is just a workaround to subscribe to the changes in the data
  // and thus to update the pagination settings at the moment when the data is fully loaded.
  // There should be a more elegant way to do this.
  @Input() data: E[] = [];

  @Input() idForSavingPagination?: string; 

  @ViewChild(MatPaginator) paginator: MatPaginator;

  user: User;
  paginatorPageSize: number = 10;
  paginatorPageSizeBeforeToggle: number = 10;
  paginatorPageSizeOptions: Array<number> = [3, 10, 20, 50];
  paginatorPageIndex: number = 0;
  allToggle: boolean = false;

  // This key is used to save the pagination settings on the user entity
  paginatorKey: string;

  constructor(
    private sessionService: SessionService,
    private entityMapperService: EntityMapperService,
    private router: Router,
  ) {
    this.paginatorKey = getUrlWithoutParams(this.router);
  }

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
    // Use URl as key to save pagination settings
    console.log("Ich benutze als ID: " + this.paginatorKey)
    this.paginatorPageSize =
      this.user.paginatorSettingsPageSize[this.paginatorKey] ||
      this.paginatorPageSize;
    this.paginatorPageIndex =
      this.user.paginatorSettingsPageIndex[this.paginatorKey] ||
      this.paginatorPageIndex;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["idForSavingPagination"]) { 
      this.paginatorKey = this.paginatorKey + "_" + this.idForSavingPagination;
      console.log("Der paginatorKey ist : " + this.paginatorKey);
    }
    else {
      this.allToggle =
        this.paginatorPageSize >= this.dataSource.data.length;
      this.getPaginatorPageSize();
      this.getPaginatorPageSizeOptions();
    }
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
    this.allToggle =
      this.paginatorPageSize >= this.dataSource.data.length;
  }

  getPaginatorPageSizeOptions() {
    const ar = [3, 10, 20, 50].filter((n) => {
      return n < this.dataSource.data.length;
    });
    ar.push(this.dataSource.data.length);
    this.paginatorPageSizeOptions = ar;
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

  clickAllToggle() {
    if (!this.allToggle) {
      this.paginatorPageSizeBeforeToggle = this.paginatorPageSize;
      this.paginatorPageSize = this.dataSource.data.length;
    } else {
      if (
        this.paginatorPageSizeBeforeToggle <= this.dataSource.data.length
      ) {
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
