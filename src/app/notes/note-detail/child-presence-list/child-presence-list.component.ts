import {Component, Input, OnInit} from '@angular/core';
import {NoteModel} from '../../note.model';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-child-presence-list',
  templateUrl: './child-presence-list.component.html',
  styleUrls: ['./child-presence-list.component.scss']
})
export class ChildPresenceListComponent implements OnInit {

  @Input() note: NoteModel;
  @Input() recordForm: NgForm;
  @Input() present: boolean;
  @Input() label: string;

  constructor() { }

  ngOnInit() {
  }

}
