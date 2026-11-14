import { createElement, useLayoutEffect, useRef, type CSSProperties, type ClipboardEvent, type KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  editable: boolean;
  as?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  /** When not editable, makes the text act like a link/button. */
  onActivate?: () => void;
}

/**
 * Click-to-edit plain text. The DOM text is managed by hand (not as React children)
 * so typing never fights React's reconciliation or moves the cursor.
 */
export default function EditableText({
  value,
  onChange,
  editable,
  as = "span",
  className = "",
  style,
  placeholder = "Type here…",
  onActivate,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== value) el.innerText = value;
  }, [value]);

  const commit = () => {
    const text = (ref.current?.innerText ?? "").replace(/\s+/g, " ").trim();
    if (text !== value) onChange(text);
    else if (ref.current) ref.current.innerText = value;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
    document.execCommand("insertText", false, text);
  };

  const live = !editable && !!onActivate;

  return createElement(as, {
    ref,
    className: `${className} ${
      editable
        ? "cursor-text rounded-sm outline-offset-4 hover:outline hover:outline-1 hover:outline-dashed hover:outline-sky-500/60 focus:outline focus:outline-2 focus:outline-sky-500 empty:before:opacity-50 empty:before:content-[attr(data-placeholder)]"
        : live
          ? "cursor-pointer select-none hover:opacity-80 hover:underline hover:underline-offset-4"
          : ""
    }`,
    style,
    ...(live
      ? {
          role: "link",
          tabIndex: 0,
          onClick: onActivate,
          onKeyDown: (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onActivate?.()),
        }
      : {}),
    contentEditable: editable,
    suppressContentEditableWarning: true,
    spellCheck: editable,
    "data-placeholder": placeholder,
    onBlur: editable ? commit : undefined,
    ...(editable ? { onKeyDown } : {}),
    onPaste: editable ? onPaste : undefined,
  });
}
