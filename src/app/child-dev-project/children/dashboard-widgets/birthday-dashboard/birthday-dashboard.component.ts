import { Component, AfterViewInit, OnInit, ViewChild } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  private readonly today: Date;
  childrenDataSource = new MatTableDataSource<{
    child: Child;
    birthday: Date;
  }>();
  isLoading = true;

  constructor(private entityMapper: EntityMapperService) {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
  }

  async ngOnInit() {
    const children = await this.entityMapper.loadType(Child);

    // Only active children with a birthday in less than 31 days are shown
    this.childrenDataSource.data = children
      .filter((child: Child) => child.isActive)
      .map((child) => ({
        child: child,
        birthday: this.getNextBirthday(child.dateOfBirth),
      }))
      .filter((a) => this.daysUntil(a.birthday) < 32)
      .sort((a, b) => this.daysUntil(a.birthday) - this.daysUntil(b.birthday));

    this.isLoading = false;
  }

  ngAfterViewInit() {
    this.childrenDataSource.paginator = this.paginator;
  }

  onInitFromDynamicConfig() {}

  private getNextBirthday(dateOfBirth: Date): Date {
    const birthday = new Date(
      this.today.getFullYear(),
      dateOfBirth.getMonth(),
      dateOfBirth.getDate()
    );

    if (this.today.getTime() > birthday.getTime()) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }
    return birthday;
  }

  private daysUntil(date: Date): number {
    const diff = date.getTime() - this.today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
