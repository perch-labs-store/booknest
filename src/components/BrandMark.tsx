/** The Fablebook app icon, used as the logo inside the app. Same artwork as the browser tab and the installed-app icon. */
export default function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <img src="/icons/icon-192.png" alt="" width={size} height={size} draggable={false} className={className} style={{ width: size, height: size }} />;
}
