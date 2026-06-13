import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { getEntityRuntimeRoute } from "app/core/entity/entity-config.service";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { map } from "rxjs/operators";
import { NotificationEvent } from "../model/notification-event";

/**
 * Deep-link redirect for notification emails.
 *
 * Route: /notification/:id
 *
 * Loads the NotificationEvent doc by id, reads its context, and navigates;
 * falls back to /user-account after 5 s or on error.
 */
@Component({
  selector: "app-notification-link",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: ``,
})
export class NotificationLinkComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly entityMapper = inject(EntityMapperService);
  private readonly hasHandledRedirect = signal(false);

  private readonly notificationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get("id"))),
    { initialValue: null },
  );

  private readonly redirectEffect = effect(() => {
    if (this.hasHandledRedirect()) {
      return;
    }

    this.hasHandledRedirect.set(true);
    void this.loadAndNavigate(this.notificationId());
  });

  private normalizeEntityId(entityType: string, entityId: string): string {
    return Entity.extractEntityIdFromId(
      Entity.createPrefixedId(entityType, entityId),
    );
  }

  private buildEntityUrl(entityType: string, entityId?: string | null): string {
    if (!this.entityRegistry.has(entityType)) return "";
    const entityCtr = this.entityRegistry.get(entityType);
    let url = getEntityRuntimeRoute(entityCtr);
    if (entityId) {
      url += `/${this.normalizeEntityId(entityType, entityId)}`;
    }
    return url;
  }

  private async loadAndNavigate(id: string | null): Promise<void> {
    const fallback = "/user-account";

    if (!id) {
      await this.router.navigate([fallback]);
      return;
    }

    let event: NotificationEvent | null = null;

    try {
      event = await Promise.race([
        this.entityMapper.load<NotificationEvent>(NotificationEvent, id),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
    } catch {
      // fall through to fallback
    }

    if (!event) {
      await this.router.navigate([fallback]);
      return;
    }

    event.readStatus = true;
    this.entityMapper.save(event).catch(() => {});

    const url = event.context?.entityType
      ? this.buildEntityUrl(event.context.entityType, event.context.entityId)
      : event.actionURL;
    await this.router.navigateByUrl(url || fallback);
  }
}
