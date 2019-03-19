import {ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {EditSchoolDialogComponent} from './edit-school-dialog/edit-school-dialog.component';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MatDialog, MatTableDataSource, MatSort} from '@angular/material';
import {Child} from '../child';
import {LoggingService} from '../../logging/logging.service';
import {ChildrenService} from '../children.service';
import {SchoolWithRelation} from '../../schools/schoolWithRelation';

@Component({
  selector: 'app-view-schools-component',
  templateUrl: './view-schools.component.html',
  styleUrls: ['./view-schools.component.scss']
})

export class ViewSchoolsComponent implements OnInit, OnChanges {

  @Input() public child: Child;
  private sort: MatSort;
  schoolsDataSource: MatTableDataSource<SchoolWithRelation> = new MatTableDataSource();
  viewableSchools: SchoolWithRelation[] = [];
  displayedColumns: string[] = ['schoolName', 'startTime', 'endTime'];

  @ViewChild(MatSort) set matSort(ms: MatSort) {    // Needed to set the mat sort later than ngAfterViewInit
    this.sort = ms;
    this.schoolsDataSource.sort = this.sort;
  }

  constructor(private entityMapperService: EntityMapperService, private dialog: MatDialog,
              private loggingService: LoggingService, private changeDetectionRef: ChangeDetectorRef,
              private childrenService: ChildrenService) {
  }

  ngOnInit() {
    this.schoolsDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'schoolName':
          return item.getSchoolName();
        case 'startTime':
          return item.getStartTime();
        case 'endTime':
          return item.getEndTime();
        default:
          return item[property];
      }
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.child && changes.child.previousValue !== changes.child.currentValue) {  // Load new school when the input child is changed
      this.loadSchoolEntries();
    }
  }


  public loadSchoolEntries() {
    this.childrenService.getViewableSchools(this.child.getId())
      .then((schools: SchoolWithRelation[]) => {
        this.viewableSchools = schools;
        this.updateViewableItems();
        this.changeDetectionRef.detectChanges();
      },
        () => this.loggingService.error('[ViewSchoolsComponent] loading from database error.')
      )
  }

  private updateViewableItems() {
    this.schoolsDataSource.data = this.viewableSchools;

  }

  schoolClicked(viewableSchool: SchoolWithRelation) {
    const data = {
          childSchoolRelation: viewableSchool.childSchoolRelation,
          child: this.child,
    };
    this.showEditSchoolDialog(data);
  }


  addSchoolClick() {
    this.showEditSchoolDialog({child: this.child});
  }

  private showEditSchoolDialog(data) {
    const dialog = this.dialog.open(EditSchoolDialogComponent, {data: data});
    dialog.afterClosed().subscribe(res => res ? this.loadSchoolEntries() : null);
  }
}
