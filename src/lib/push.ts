import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export type PushState =
  | "unsupported" // browser can't do push, or the VAPID key isn't configured
  | "needs-install" // iPhone / iPad: push only works once the app is on the Home Screen
  | "blocked" // the user said "Block" in the browser
  | "off" // can be turned on
  | "on";

const urlBase64ToUint8Array = (base64: string) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const registration = async () => (await navigator.serviceWorker?.getRegistration()) ?? (await navigator.serviceWorker?.ready);

export async function getPushState(): Promise<PushState> {
  if (!supabase || !VAPID_PUBLIC_KEY) return "unsupported";
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return Notification.permission === "granted" && sub ? "on" : "off";
}

/** Asks permission (must be called from a click), subscribes this device and saves it for the signed-in user. */
export async function enablePush(): Promise<PushState> {
  const state = await getPushState();
  if (state !== "off") return state;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "blocked" : "off";

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) }));
  const json = sub.toJSON();
  const { error } = await supabase!.rpc("save_push_subscription", {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh,
    p_auth: json.keys?.auth,
  });
  if (error) {
    await sub.unsubscribe();
    throw new Error("Couldn't save your notification settings. Make sure you ran the latest supabase/schema.sql.");
  }
  return "on";
}

export async function disablePush(): Promise<void> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase?.rpc("remove_push_subscription", { p_endpoint: sub.endpoint });
  await sub.unsubscribe();
}

/** After sign-in, re-save this device's subscription so it belongs to whoever is signed in now. */
export async function syncPushSubscription(): Promise<void> {
  if ((await getPushState()) !== "on") return;
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const json = sub.toJSON();
  await supabase!.rpc("save_push_subscription", { p_endpoint: sub.endpoint, p_p256dh: json.keys?.p256dh, p_auth: json.keys?.auth });
}
