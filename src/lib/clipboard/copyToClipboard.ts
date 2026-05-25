export async function copyToClipboard(text: string, fallbackElement?: HTMLTextAreaElement | null) {
  let selected = false;

  try {
    selected = selectText(text, fallbackElement);
  } catch {
    selected = false;
  }

  try {
    if (selected && document.queryCommandSupported?.("copy") !== false && document.execCommand("copy")) {
      return true;
    }
  } catch {
    // Continue to async clipboard fallback.
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Leave visible fallback text selected for manual copy when available.
  }

  return false;
}

function selectText(text: string, fallbackElement?: HTMLTextAreaElement | null) {
  const element = fallbackElement ?? createHiddenTextarea(text);
  element.value = text;
  element.removeAttribute("disabled");
  element.readOnly = true;
  element.focus();
  element.select();
  element.setSelectionRange(0, element.value.length);

  if (!fallbackElement) {
    window.setTimeout(() => element.remove(), 100);
  }

  return document.activeElement === element || element.selectionStart === 0;
}

function createHiddenTextarea(text: string) {
  const element = document.createElement("textarea");
  element.value = text;
  element.setAttribute("aria-hidden", "true");
  element.style.position = "fixed";
  element.style.left = "-9999px";
  element.style.top = "0";
  element.style.opacity = "0";
  document.body.appendChild(element);
  return element;
}
