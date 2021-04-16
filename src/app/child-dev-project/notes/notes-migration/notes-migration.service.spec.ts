import { TestBed } from "@angular/core/testing";

import { NotesMigrationService } from "./notes-migration.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { User } from "../../../core/user/user";
import { Note } from "../model/note";
import { Entity, EntityConstructor } from "../../../core/entity/entity";

function legacyNote(author: string) {
  const note = new Note();
  note["author"] = author;
  return note;
}

describe("NotesMigrationService", () => {
  let service: NotesMigrationService;
  const oldAuthors = [
    "Peter Lustig, Ursula",
    "Jens & Angela",
    "Albrecht",
    "Johanna",
  ];
  const users = [
    "Peter",
    "Ursula",
    "Jens",
    "Angela",
    "Albrecht",
    "Johanna",
  ].map((name) => {
    const user = new User();
    user.name = name;
    return user;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EntityMapperService,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(NotesMigrationService);
    service.allUsers = new Map(users.map((u) => [u.name.toLowerCase(), u]));
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("finds the correct user for different user-names", () => {
    const expectedUsers = [
      [users[0], users[1]],
      [users[2], users[3]],
      [users[4]],
      [users[5]],
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
    ];
    const expected = [
      ["Phillip"],
      ["Christian"],
      ["Agnes", "Strack", "Zimmermann"],
      ["Gregor Giselle"],
    ];
    nonMatchedUsers.forEach((userName, index) => {
      const foundUsers = service.findUsers(userName);
      expect(foundUsers.additional).toEqual(expected[index]);
      expect(foundUsers.detectedUsers).toHaveSize(0);
    });
  });

  it("migrates a note with existing users", () => {
    const note = legacyNote("Peter L, Ursula & Jens");
    const expectedUsers = users.slice(0, 3).map((u) => u.getId());
    service.migrateSingleNote(note);
    expect(note["author"]).not.toBeDefined();
    expect(note.authors).toEqual(expectedUsers);
    expect(note.text).toHaveSize(0);
  });

  it("appends a note-text with all non-found users", () => {
    const note = legacyNote("Peter L, Ursula & Andi");
    note.text = "Lorem ipsum";
    const expectedUsers = users.slice(0, 2).map((u) => u.getId());
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
    const migratedNotes: Note[] = [];
    // @ts-ignore
    service["entityMapperService"] = {
      loadType<T extends Entity>(
        entityType: EntityConstructor<T>
      ): Promise<T[]> {
        if (new entityType().getType() === "Note") {
          return Promise.resolve((notes as unknown) as T[]);
        } else if (new entityType().getType() === "User") {
          return Promise.resolve((users as unknown) as T[]);
        } else {
          return Promise.resolve([]);
        }
      },
      save<T extends Entity>(entity: T): Promise<any> {
        if (entity.getType() === "Note") {
          migratedNotes.push((entity as unknown) as Note);
        }
        return Promise.resolve();
      },
    };
    await service.migrateToMultiUser();
    const existingUsers = users.slice(0, 2).map((u) => u.getId());
    expect(migratedNotes).toHaveSize(4);
    migratedNotes.forEach((note) => {
      expect(note["author"]).not.toBeDefined();
    });
    expect(migratedNotes[0].authors).toHaveSize(0);
    expect(migratedNotes[1].authors).toEqual(existingUsers);
    expect(migratedNotes[1].text).toHaveSize(0);
    expect(migratedNotes[2].authors).toEqual(existingUsers);
    expect(migratedNotes[2].text).toEqual("Also authored by Andi");
    expect(migratedNotes[3].authors).toHaveSize(0);
    expect(migratedNotes[3].text).toEqual("Also authored by Johannes");
  });

  it("does not change an already migrated note", () => {
    const note = new Note();
    note.authors = users.slice(0, 3).map((u) => u.getId());
    note.text = "Lorem ipsum";
    note.date = new Date();
    const copy = note.copy();
    service.migrateSingleNote(note);
    expect(note).toEqual(copy);
  });
});
