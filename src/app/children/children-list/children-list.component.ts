import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {Child} from '../child';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {ChildrenService, TableChild} from '../children.service';
import {AttendanceMonth} from '../attendance/attendance-month';
import {FilterSelection} from '../../ui-helper/filter-selection/filter-selection';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit, AfterViewInit {
  childrenList = [];
  attendanceList = new Map<string, AttendanceMonth[]>();
  childrenDataSource = new MatTableDataSource();

  centerFS = new FilterSelection('center', []);
  dropoutFS = new FilterSelection('status', [
        {key: 'active', label: 'Current Project Children', filterFun: (c: TableChild) => c.isActive()},
        {key: 'dropout', label: 'Dropouts', filterFun: (c: TableChild) => !c.isActive()},
        {key: '', label: 'All', filterFun: (c: TableChild) => true},
      ]);
  filterSelections = [
    this.dropoutFS,
    this.centerFS,
  ];


  @ViewChild(MatSort) sort: MatSort;
  columnGroupSelection = 'School Info';
  columnGroups = {
    'Basic Info': ['projectNumber', 'name', 'age', 'gender', 'schoolClass', 'schoolId', 'center', 'status'],
    'School Info': ['projectNumber', 'name', 'age', 'schoolClass', 'schoolId', 'attendance-school', 'attendance-coaching', 'motherTongue'],
    'Status': ['projectNumber', 'name', 'center', 'status', 'admissionDate',
      'has_aadhar', 'has_kanyashree', 'has_bankAccount', 'has_rationCard', 'has_bplCard'],
    'Health': ['projectNumber', 'name', 'center',
      'health_vaccinationStatus', 'health_LastDentalCheckup', 'health_LastEyeCheckup', 'health_eyeHealthStatus', 'health_LastENTCheckup',
      'health_LastVitaminD', 'health_LastDeworming',
      'gender', 'age', 'dateOfBirth'],
  };
  columnsToDisplay: ['projectNumber', 'name'];
  filterString = '';


  constructor(private childrenService: ChildrenService,
              private router: Router,
              private route: ActivatedRoute) {  }

  ngOnInit() {
    this.loadData(true, /*Replace URL instead of navigating*/);
    this.loadUrlParams(true /*Replace URL instead of navigating*/);
  }


  private loadUrlParams(replaceUrl: boolean = false) {
    this.route.queryParams.subscribe(params => {
        this.columnGroupSelection = params['view'] ? params['view'] : this.columnGroupSelection;
        this.displayColumnGroup(this.columnGroupSelection);

        this.filterSelections.forEach(f => {
        f.selectedOption = params[f.name];
        if (f.selectedOption === undefined && f.options.length > 0) {
          f.selectedOption = f.options[0].key;
        }
      });
      this.applyFilterSelections(replaceUrl);
    });
  }

  ngAfterViewInit() {
    this.childrenDataSource.sort = this.sort;
  }


  private loadData(replaceUrl: boolean = false) {
    this.childrenService.getChildrenForList()
      .then((data: TableChild[]) => {
      this.childrenList = data;

      const centers = data.map(c => c.center).filter((value, index, arr) => arr.indexOf(value) === index);
      this.centerFS.initOptions(centers, 'center');

      this.applyFilterSelections(replaceUrl);
    });

    this.childrenService.getAttendances()
      .subscribe(results => this.prepareAttendanceData(results));
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
    this.columnGroupSelection = columnGroup;
    this.columnsToDisplay = this.columnGroups[columnGroup];
    this.updateUrl();
  }

  updateUrl(replaceUrl: boolean = false) {
    const params = {};
    this.filterSelections.forEach(f => {
      params[f.name] = f.selectedOption;
    });

    params['view'] = this.columnGroupSelection;

    this.router.navigate(['child'], { queryParams: params, replaceUrl: replaceUrl });
  }

  applyFilterSelections(replaceUrl: boolean = false) {
    let filteredData = this.childrenList;

    this.filterSelections.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.childrenDataSource.data = filteredData;

    this.updateUrl(replaceUrl);
  }


  addChildClick() {
    this.router.navigate(['/child', 'new']);
  }


  showChildDetails(child: Child) {
    this.router.navigate(['/child', child.getId()]);
  }
}
