import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {EntityMapperService} from '../../../entity/entity-mapper.service';
import {Note} from '../note';
import {NoteDetailsComponent} from '../note-details/note-details.component';
import {SessionService} from '../../../session/session.service';
import {FilterSelection} from '../../../ui-helper/filter-selection/filter-selection';
import {WarningLevel} from '../../attendance/warning-level';

@Component({
  selector: 'app-notes-manager',
  templateUrl: './notes-manager.component.html',
  styleUrls: ['./notes-manager.component.scss']
})
export class NotesManagerComponent implements OnInit, AfterViewInit {

  entityList = new Array<Note>();
  notesDataSource = new MatTableDataSource();

  @ViewChild(MatSort) sort: MatSort;
  columnsToDisplay = ['date', 'subject', 'category', 'author', 'children'];

  filterString = '';

  followUpFS = new FilterSelection<Note>('status', [
    { key: 'urgent', label: 'Urgent', filterFun: (n: Note) => n.warningLevel === WarningLevel.URGENT },
    { key: 'follow-up', label: 'Needs Follow-Up',
      filterFun: (n: Note) => n.warningLevel === WarningLevel.WARNING || n.warningLevel === WarningLevel.URGENT },
    { key: '', label: 'All', filterFun: (c: Note) => true },
  ]);
  dateFS = new FilterSelection<Note>('date', [
    { key: 'current-week', label: 'This Week',
      filterFun: (n: Note) => n.date > this.getPreviousSunday(0) },
    { key: 'last-week', label: 'Since Last Week', filterFun: (n: Note) => n.date > this.getPreviousSunday(1) },
    { key: '', label: 'All', filterFun: (c: Note) => true },
  ]);
  filterSelections = [
    this.followUpFS,
    this.dateFS,
  ];

  categoryFS = new FilterSelection<Note>('category', []);
  filterSelectionsDropdown = [
    this.categoryFS,
  ];


  constructor(private entityMapper: EntityMapperService,
              private dialog: MatDialog,
              private sessionService: SessionService) { }

  ngOnInit() {
    this.entityMapper.loadType<Note>(Note)
      .then(data => {
        this.entityList = data.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0) );
        this.applyFilterSelections();
    });

    this.initCategoryFilter();
  }

  private initCategoryFilter() {
    this.categoryFS.options = [
      { key: '', label: '', filterFun: (n: Note) => true },
    ];

    Note.INTERACTION_TYPES.forEach(t => {
      this.categoryFS.options.push({ key: t, label: t, filterFun: (n: Note) => n.category === t })
    });

    this.applyFilterSelections();
  }

  ngAfterViewInit() {
    this.notesDataSource.sort = this.sort;
  }


  private getPreviousSunday(weeksBack: number) {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day - 7 * weeksBack; // adjust when day is sunday
    return new Date(today.setDate(diff));
  }


  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.notesDataSource.filter = filterValue;
  }

  applyFilterSelections() {
    let filteredData = this.entityList;

    this.filterSelections.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });
    this.filterSelectionsDropdown.forEach(f => {
      filteredData = filteredData.filter(f.getSelectedFilterFunction());
    });

    this.notesDataSource.data = filteredData;
  }



  addNoteClick() {
    const newNote = new Note(Date.now().toString());
    newNote.date = new Date();
    newNote.author = this.sessionService.getCurrentUser().name;

    this.showDetails(newNote);
  }


  showDetails(entity: Note) {
    this.dialog.open(NoteDetailsComponent, {width: '80%', data: {entity: entity}});
  }
}
