import { renderTextSlides } from "../demo/slideRenderer";

export type SimpleSlide = {
  title: string;
  bullets: string[];
  body: string[];
};

/**
 * Minimal markdown-ish format:
 *   # Slide title
 *   Some paragraph text.
 *   - a bullet
 *   - another bullet
 *   ---
 *   # Next slide title
 *   ...
 *
 * The "# " prefix is optional — the first line of a block is treated as
 * the title either way. Lines starting with "-" or "*" become bullets;
 * everything else becomes body text.
 */
export function parseSimpleDeck(text: string): SimpleSlide[] {
  const blocks = text.split(/\n\s*-{3,}\s*\n/);

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      let title = "";
      const bullets: string[] = [];
      const body: string[] = [];

      for (const line of lines) {
        if (line.startsWith("# ")) {
          title = line.slice(2).trim();
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          bullets.push(line.slice(2).trim());
        } else if (!title) {
          title = line;
        } else {
          body.push(line);
        }
      }

      return { title, bullets, body };
    })
    .filter((s) => s.title || s.bullets.length > 0 || s.body.length > 0);
}

/** Parses the simple markdown-ish format and rasterizes it straight to slide images. */
export function renderSimpleDeck(text: string): string[] {
  const slides = parseSimpleDeck(text);
  return renderTextSlides(
    slides.map((s) => ({
      title: s.title || "Untitled slide",
      body: s.body,
      bullets: s.bullets,
      accent: "#8b5cf6",
    }))
  );
}

export const SIMPLE_DECK_PLACEHOLDER = `# Welcome
A short talk about something interesting.
---
# Agenda
- Problem
- Approach
- Results
- Next steps
---
# Thank you
Questions welcome.`;
