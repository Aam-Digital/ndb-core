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
import { LoggingService } from "../../logging/logging.service";

@Component({
  selector: "app-user-select",
  templateUrl: "./user-select.component.html",
  styleUrls: ["./user-select.component.scss"],
})
export class UserSelectComponent implements OnInit {
  @Input() selectedUsers: User[] = [];
  @Output() selectedUsersChange = new EventEmitter<User[]>();

  allUsers: User[] = [];
  suggestedUsers: User[] = [];

  searchText: string = "";
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
  @ViewChild("inputField", { static: true }) inputField;

  constructor(
    private entityMapperService: EntityMapperService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.entityMapperService
      .loadType<User>(User)
      .then((users) => {
        this.allUsers = [...users];
        this.onInputChanged();
      })
      .catch((reason) => {
        this.loggingService.warn(reason);
      });
  }

  selectUser(user: User) {
    this.selectedUsersChange.emit([user].concat(this.selectedUsers));
    this.searchText = "";
    this.inputField.nativeElement.value = "";
  }

  selectCurrentSearch() {
    if (this.searchText.length > 0) {
      const user = this.allUsers.find((u) => u.name === this.searchText);
      if (user) {
        this.selectUser(user);
      }
    }
  }

  unselectUser(user: User) {
    const index = this.selectedUsers.findIndex(
      (u) => u.getId() === user.getId()
    );
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
      this.selectedUsersChange.emit(this.selectedUsers);
    }
  }

  onInputChanged(): void {
    this.suggestedUsers = this.allUsers.filter((user) =>
      user.name.toLowerCase().startsWith(this.searchText.toLowerCase())
    );
  }
}
