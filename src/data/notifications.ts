export type NotificationType = "like" | "follow" | "comment" | "update" | "milestone";

export interface AppNotification {
  id: number;
  type: NotificationType;
  /** Person who triggered it. Omitted for system notifications. */
  actor?: string;
  /** Bold headline, e.g. "Maria Kellen liked your book". */
  title: string;
  /** Gold highlighted line (book title) or quoted comment. */
  detail?: string;
  detailKind?: "book" | "quote";
  time: string;
  cover?: string;
  read: boolean;
}

export const initialNotifications: AppNotification[] = [];
