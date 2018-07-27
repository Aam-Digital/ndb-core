import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Child} from '../child';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {ChildrenService} from '../children.service';
import {AttendanceMonth} from '../attendance/attendance-month';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import {FilterSelection} from './filter-selection';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList = new Array<Child>();
  attendanceList = new Map<string, AttendanceMonth[]>();
  childrenDataSource = new MatTableDataSource();

  centerFS = new FilterSelection('center', []);
  dropoutFS = new FilterSelection('status', [
        {key: 'active', label: 'Current Project Children', filterFun: (c: Child) => c.isActive()},
        {key: 'dropout', label: 'Dropouts', filterFun: (c: Child) => !c.isActive()},
        {key: '', label: 'All', filterFun: (c: Child) => true},
      ]);
  filterSelections = [
    this.dropoutFS,
    this.centerFS,
  ];


  @ViewChild(MatSort) sort: MatSort;
  columnGroupSelection = 'school';
  columnGroups = {
    'basic': ['projectNumber', 'name', 'age', 'gender', 'class', 'school', 'center', 'status'],
    'school': ['projectNumber', 'name', 'age', 'class', 'school', 'attendance-school', 'attendance-coaching', 'motherTongue'],
    'status': ['projectNumber', 'name', 'center', 'status', 'aadhar', 'admission'],
    'health': ['projectNumber', 'name', 'center',
      'vaccination', 'dentalCheckup', 'eyeCheckup', 'eyeStatus', 'EntCheckup', 'vitaminD', 'deworming',
      'gender', 'age', 'dateOfBirth'],
  };
  columnsToDisplay: ['projectNumber', 'name'];

  filterString = '';


  constructor(private childrenService: ChildrenService,
              private router: Router,
              private route: ActivatedRoute,
              private entityMapper: EntityMapperService) {  }

  ngOnInit() {
    this.loadData();
    this.loadUrlParams();
  }


  private loadUrlParams() {
    // TODO: also encode in / retrieve from URL
    this.displayColumnGroup(this.columnGroupSelection);

    this.route.queryParams.subscribe(params => {
      this.filterSelections.forEach(f => {
        f.selectedOption = params[f.name];
      });
      this.applyFilterSelections();
    });
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
  }


  private loadData() {
    this.childrenService.getChildren().subscribe(data => {
      this.childrenList = data;

      const centers = data.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
      this.initCenterFilterOptions(centers);

      this.applyFilterSelections();
    });

    this.childrenService.getAttendances()
      .subscribe(results => this.prepareAttendanceData(results));
  }

  private initCenterFilterOptions(centers: string[]) {
    const options = [{key: '', label: 'All', filterFun: (c: Child) => true}];

    centers.forEach(center => {
      options.push({key: center.toLowerCase(), label: center, filterFun: (c: Child) => c.center === center});
    });

    this.centerFS.options = options;
  }


  prepareAttendanceData(loadedEntities: AttendanceMonth[]) {
    this.attendanceList = new Map<string, AttendanceMonth[]>();
    loadedEntities.forEach(x => {
      if (!this.attendanceList.has(x.student)) {
        this.attendanceList.set(x.student, new Array<AttendanceMonth>());
      }
      this.attendanceList.get(x.student).push(x);
    });

    this.attendanceList.forEach(studentsAttendance => {
      studentsAttendance.sort((a, b) => {
        // descending by date
        if (a.month > b.month) { return -1; }
        if (a.month < b.month) { return 1; }
        return 0;
      });
    });
  }



  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.childrenDataSource.filter = filterValue;
  }

  displayColumnGroup(columnGroup: string) {
    this.columnsToDisplay = this.columnGroups[columnGroup];
  }


  updateFilterSelections() {
    const params = {};
    this.filterSelections.forEach(f => {
      params[f.name] = f.selectedOption;
    });
    this.router.navigate(['child'], { queryParams: params });

    this.applyFilterSelections();
  }

  applyFilterSelections() {
    let filteredData = this.childrenList;

    this.filterSelections.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;
  }


  addChildClick() {
    let route: string;
    route = this.router.url + '/new';
  }


  showChildDetails(child: Child) {
      this.router.navigate(['/child', child.getId()]);
  }
}
