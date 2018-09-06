import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ChildSchoolRelation} from "../childSchoolRelation";
import {School} from "../../schools/school";
import {EditSchoolDialogComponent} from "./edit-school-dialog/edit-school-dialog.component";
import {EntityMapperService} from "../../entity/entity-mapper.service";
import {MatDialog, MatTableDataSource, MatSort} from "@angular/material";
import {Child} from "../child";
import {LoggingService} from "../../logging/logging.service";

export interface ViewableSchool {
  school: School,
  childSchoolRelation: ChildSchoolRelation,
}

@Component({
  selector: 'app-view-schools-component',
  templateUrl: './view-schools-component.component.html',
  styleUrls: ['./view-schools-component.component.scss']
})

export class ViewSchoolsComponentComponent implements OnInit {

  @Input() public child: Child = new Child('');
  @ViewChild(MatSort) sort: MatSort;

  schoolsDataSource: MatTableDataSource<ViewableSchool> = new MatTableDataSource();
  viewableSchools: ViewableSchool[] = [];
  childSchoolRelations: ChildSchoolRelation[] = [];
  displayedColumns: string[] = ['name', 'from', 'to'];

  constructor(private entityMapperService: EntityMapperService,
              private dialog: MatDialog, private loggingService: LoggingService) {
    this.loadSchoolEntries();
  }

  ngOnInit() {
    this.schoolsDataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'name':
          return item.school.name;
        case 'from':
          return item.childSchoolRelation.start;
        case 'to':
          return item.childSchoolRelation.end;
        default:
          return item[property];
      }
    };
    this.schoolsDataSource.sort = this.sort;
  }

  public loadSchoolEntries() {
    this.viewableSchools = [];
    this.childSchoolRelations = [];
    this.entityMapperService.loadType<ChildSchoolRelation>(ChildSchoolRelation)
      .then((relations: ChildSchoolRelation[]) => {
        for (let r of relations) {
          if (r.childId == this.child.getId()) {
            this.childSchoolRelations.push(r);
            this.entityMapperService.load<School>(School, r.schoolId)
              .then((school: School) => {
                this.viewableSchools.push({
                  school: school,
                  childSchoolRelation: r,
                });
                this.updateViewableItems();
              })
          }
        }
      })
      .catch(() => this.loggingService.error("[ViewSchoolsComponent] loading from database error."))
  }

  private updateViewableItems() {
    this.schoolsDataSource.data = this.viewableSchools;
    this.schoolsDataSource.sort = this.sort;
  }

  schoolClicked(viewableSchool) {
    let dialog = this.dialog.open(EditSchoolDialogComponent, {
      data: {
        childSchoolRelation: viewableSchool.childSchoolRelation,
        child: this.child,
      }});
    dialog.afterClosed().subscribe(res => {
      if (res) {
        viewableSchool.childSchoolRelation = res.childSchoolRelation;
        viewableSchool.school = res.school;
        this.updateViewableItems();
      }
    })
  }

  addSchoolClick() {
    let dialog = this.dialog.open(EditSchoolDialogComponent, {data: {child: this.child}});
    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.viewableSchools.push({
          school: res.school,
          childSchoolRelation: res.childSchoolRelation,
        });
        this.updateViewableItems();
      }
    })
  }
}
