import { TestBed } from "@angular/core/testing";

import { NotesMigrationService } from "./notes-migration.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { User } from "../../../core/user/user";
import { Note } from "../model/note";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../core/entity/mock-entity-mapper-service";
import { AlertService } from "../../../core/alerts/alert.service";

function legacyNote(author: string): Note {
  const note = new Note();
  note["author"] = author;
  return note;
}

function createUser(name: string): User {
  const user = new User();
  user.name = name;
  return user;
}

describe("NotesMigrationService", () => {
  let service: NotesMigrationService;
  const Peter = createUser("Peter");
  const Ursula = createUser("Ursula");
  const Jens = createUser("Jens");
  const Angela = createUser("Angela");
  const Albrecht = createUser("Albrecht");
  const Johanna = createUser("Johanna");
  const users = [Peter, Ursula, Jens, Angela, Albrecht, Johanna];

  let entityMapper: MockEntityMapperService;

  beforeEach(() => {
    entityMapper = mockEntityMapper([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: entityMapper,
        },
        { provide: AlertService, useValue: jasmine.createSpyObj(["addAlert"]) },
      ],
    });
    service = TestBed.inject(NotesMigrationService);
    service.allUsers = new Map(users.map((u) => [u.name.toLowerCase(), u]));
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("finds the correct user for different user-names", () => {
    const oldAuthors = [
      "Peter Lustig, Ursula",
      "Jens & Angela",
      "Albrecht",
      "Johanna",
      "Peter, Jens, Albrecht, Johanna",
    ];
    const expectedUsers = [
      [Peter, Ursula],
      [Jens, Angela],
      [Albrecht],
      [Johanna],
      [Peter, Jens, Albrecht, Johanna],
    ];
    oldAuthors.forEach((authorName, index) => {
      const foundUsers = service.findUsers(authorName);
      expect(foundUsers.detectedUsers).toEqual(expectedUsers[index]);
      expect(foundUsers.additional).toHaveSize(0);
    });
  });

  it("returns an array of users that could not be matched", () => {
    const nonMatchedUsers = [
      "Phillip",
      "Christian",
      "Agnes, Strack & Zimmermann",
      "Gregor Giselle",
      "Insalata and mista",
    ];
    const expected = [
      ["Phillip"],
      ["Christian"],
      ["Agnes", "Strack", "Zimmermann"],
      ["Gregor Giselle"],
      ["Insalata", "mista"],
    ];
    nonMatchedUsers.forEach((userName, index) => {
      const foundUsers = service.findUsers(userName);
      expect(foundUsers.additional).toEqual(expected[index]);
      expect(foundUsers.detectedUsers).toHaveSize(0);
    });
  });

  it("migrates a note with existing users", () => {
    const note = legacyNote("Peter L, Ursula & Jens");
    const expectedUsers = [Peter, Ursula, Jens].map((u) => u.getId());
    service.migrateSingleNote(note);
    expect(note["author"]).not.toBeDefined();
    expect(note.authors).toEqual(expectedUsers);
    expect(note.text).toHaveSize(0);
  });

  it("appends a note-text with all non-found users", () => {
    const note = legacyNote("Peter L, Ursula & Andi");
    note.text = "Lorem ipsum";
    const expectedUsers = [Peter, Ursula].map((u) => u.getId());
    service.migrateSingleNote(note);
    expect(note.authors).toEqual(expectedUsers);
    const newText = note.text.split("\n");
    expect(newText).toHaveSize(2);
    expect(newText[0]).toEqual("Lorem ipsum");
    expect(newText[1]).toEqual("Also authored by Andi");
  });

  it("migrates all existing notes", async () => {
    const notes = [
      legacyNote(""),
      legacyNote("Peter L, Ursula"),
      legacyNote("Peter L, Ursula & Andi"),
      legacyNote("Johannes"),
    ];
    entityMapper.addAll(notes);
    entityMapper.addAll(users);
    await service.migrateToMultiUser();
    const existingUsers = [Peter, Ursula].map((u) => u.getId());
    const migratedNotes = entityMapper.getAll<Note>("Note");
    expect(migratedNotes).toHaveSize(4);
    migratedNotes.forEach((note) => {
      expect(note["author"]).not.toBeDefined();
    });
    expect(migratedNotes[0].authors).toHaveSize(0);
    expect(migratedNotes[0].text).toHaveSize(0);
    expect(migratedNotes[1].authors).toEqual(existingUsers);
    expect(migratedNotes[1].text).toHaveSize(0);
    expect(migratedNotes[2].authors).toEqual(existingUsers);
    expect(migratedNotes[2].text).toEqual("Also authored by Andi");
    expect(migratedNotes[3].authors).toHaveSize(0);
    expect(migratedNotes[3].text).toEqual("Also authored by Johannes");
  });

  it("does not change an already migrated note", () => {
    const note = new Note();
    note.authors = [Peter, Ursula, Jens].map((u) => u.getId());
    note.text = "Lorem ipsum";
    note.date = new Date();
    const copy = note.copy();
    service.migrateSingleNote(note);
    expect(note).toEqual(copy);
  });
});
