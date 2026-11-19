import { Injectable, inject } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { DemoChildGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoChildSchoolRelationGenerator } from "../../../child-dev-project/children/demo-data-generators/demo-child-school-relation-generator.service";
import { DemoNoteGeneratorService } from "../../../child-dev-project/notes/demo-data/demo-note-generator.service";
import { DemoTodoGeneratorService } from "../../todos/model/demo-todo-generator.service";
import { Whiteboard } from "./whiteboard";
import { createWhiteboardItem, WhiteboardItem } from "./whiteboard-item";

/**
 * Generate a demo whiteboard mapping the records around one child:
 * the child, its school and notes with reference lines, plus a sticky note, a group and a manual connection.
 */
@Injectable()
export class DemoWhiteboardGeneratorService extends DemoDataGenerator<Whiteboard> {
  private readonly demoChildren = inject(DemoChildGenerator);
  private readonly demoRelations = inject(DemoChildSchoolRelationGenerator);
  private readonly demoNotes = inject(DemoNoteGeneratorService);
  private readonly demoTodos = inject(DemoTodoGeneratorService);

  static provider() {
    return [
      {
        provide: DemoWhiteboardGeneratorService,
        useClass: DemoWhiteboardGeneratorService,
      },
    ];
  }

  generateEntities(): Whiteboard[] {
    const child = this.demoChildren.entities.find((c) => !c.inactive);
    if (!child) {
      return [];
    }
    const childId = child.getId();
    const schoolIds = this.demoRelations.entities
      .filter((r) => r.childId === childId)
      .map((r) => r.schoolId);
    const noteIds = this.demoNotes.entities
      .filter((n) => n.relatedEntities?.includes(childId))
      .slice(0, 3)
      .map((n) => n.getId());
    const todoIds = this.demoTodos.entities
      .filter((t) => t.relatedEntities?.includes(childId))
      .slice(0, 1)
      .map((t) => t.getId());

    return [
      generateWhiteboard({
        title: $localize`Case overview ${child.toString()}`,
        centerEntityId: childId,
        schoolIds: Array.from(new Set(schoolIds)).slice(0, 2),
        noteIds,
        todoIds,
      }),
    ];
  }
}

export function generateWhiteboard(params: {
  title: string;
  centerEntityId: string;
  schoolIds?: string[];
  noteIds?: string[];
  todoIds?: string[];
}): Whiteboard {
  const items: WhiteboardItem[] = [];

  const center = createWhiteboardItem.entity(params.centerEntityId, {
    x: 400,
    y: 300,
  });
  items.push(center);

  (params.schoolIds ?? []).forEach((id, i) =>
    items.push(createWhiteboardItem.entity(id, { x: 400 + i * 260, y: 80 })),
  );

  const notesGroup = createWhiteboardItem.group(
    { x: 780, y: 240 },
    $localize`Recent notes`,
  );
  notesGroup.width = 280;
  notesGroup.height = 60 + 90 * Math.max(1, params.noteIds?.length ?? 0);
  items.push(notesGroup);
  (params.noteIds ?? []).forEach((id, i) =>
    items.push(createWhiteboardItem.entity(id, { x: 810, y: 290 + i * 90 })),
  );

  (params.todoIds ?? []).forEach((id, i) =>
    items.push(createWhiteboardItem.entity(id, { x: 400 + i * 260, y: 520 })),
  );

  const note = createWhiteboardItem.note({ x: 60, y: 300 });
  note.text = $localize`Discuss support plan in next team meeting`;
  note.color = "yellow";
  items.push(note);
  items.push(
    createWhiteboardItem.connection(note.id, center.id, $localize`to do`),
  );

  return Whiteboard.create({ title: params.title, items });
}
