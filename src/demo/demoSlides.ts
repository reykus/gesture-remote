import { renderTextSlides, type TextSlideContent } from "./slideRenderer";

const SLIDES: TextSlideContent[] = [
  {
    title: "Gesture Remote",
    body: ["Control this deck with your hand — no clicker, no keyboard."],
    accent: "#8b5cf6",
  },
  {
    eyebrow: "01",
    title: "Swipe right → next",
    body: ["Move your hand to your right to advance a slide."],
    accent: "#4fd8ea",
  },
  {
    eyebrow: "02",
    title: "Swipe left → previous",
    body: ["Same motion, moved to your left, steps back a slide."],
    accent: "#4fd8ea",
  },
  {
    eyebrow: "03",
    title: "Point → laser pointer",
    body: ["Extend just your index finger to highlight anything on screen."],
    accent: "#f97316",
  },
  {
    eyebrow: "04",
    title: "Hold a fist → blackout",
    body: ["Close your hand and hold for about a second to blank the screen, hold again to bring it back."],
    accent: "#f87171",
  },
  {
    eyebrow: "05",
    title: "Bring your own deck",
    body: ["Open the menu in the top-left corner to load a PDF, images, or write simple slides."],
    accent: "#8b5cf6",
  },
];

export function generateDemoSlides(): string[] {
  return renderTextSlides(SLIDES);
}
