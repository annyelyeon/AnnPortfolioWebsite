import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm";

marked.setOptions({ gfm: true, breaks: true });

// Sanitized so nothing in a post can run scripts on the page.
export const renderMarkdown = (md) => DOMPurify.sanitize(marked.parse(md || ""));
