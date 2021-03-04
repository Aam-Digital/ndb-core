import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { User } from "../user";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { AlertService } from "../../alerts/alert.service";
import { LoggingService } from "../../logging/logging.service";

@Component({
  selector: "app-user-select",
  templateUrl: "./user-select.component.html",
  styleUrls: ["./user-select.component.scss"],
})
export class UserSelectComponent implements OnInit {
  @Input() selectedUsers: User[];
  @Output() selectedUserChange = new EventEmitter<User[]>();

  allUsers: User[];
  suggestedUsers: User[];

  searchText: string = "";
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

  constructor(
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.entityMapperService
      .loadType<User>(User)
      .then((users) => {
        this.allUsers = users;
        this.onInputChanged();
      })
      .catch((reason) => {
        this.alertService.addWarning("Cannot load Users");
        this.loggingService.warn(reason);
        this.allUsers = [];
        this.suggestedUsers = [];
      });
  }

  selectUser(user: User) {
    this.selectedUsers.push(user);
    this.selectedUserChange.emit(this.selectedUsers);
    this.searchText = "";
  }

  onInputChanged(): void {
    this.suggestedUsers = this.allUsers.filter((user) =>
      user.name.toLowerCase().startsWith(this.searchText)
    );
  }
}
