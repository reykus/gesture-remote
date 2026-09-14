export type TextSlideContent = {
  eyebrow?: string;
  title: string;
  body?: string[];
  bullets?: string[];
  accent?: string;
};

const DEFAULT_ACCENT = "#8b5cf6";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export function renderTextSlide(
  canvas: HTMLCanvasElement,
  content: TextSlideContent,
  index: number,
  total: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const accent = content.accent ?? DEFAULT_ACCENT;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#0e0b1a");
  bg.addColorStop(1, "#171227");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  const contentTop = height * 0.28;
  ctx.fillStyle = accent;
  ctx.fillRect(96, contentTop, 6, 64);

  let cursorY = contentTop - 8;
  if (content.eyebrow) {
    ctx.fillStyle = "rgba(237, 233, 247, 0.55)";
    ctx.font = "600 26px Sora, sans-serif";
    ctx.fillText(content.eyebrow, 128, cursorY);
  }

  cursorY = contentTop + 56;
  ctx.fillStyle = "#ede9f7";
  ctx.font = "700 58px Sora, sans-serif";
  cursorY = wrapText(ctx, content.title, 128, cursorY, width - 300, 66) + 20;

  if (content.body?.length) {
    ctx.fillStyle = "rgba(237, 233, 247, 0.75)";
    ctx.font = "400 28px Inter, sans-serif";
    for (const line of content.body) {
      cursorY = wrapText(ctx, line, 128, cursorY, width - 420, 40) + 12;
    }
  }

  if (content.bullets?.length) {
    ctx.font = "400 28px Inter, sans-serif";
    for (const bullet of content.bullets) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(136, cursorY - 9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(237, 233, 247, 0.85)";
      cursorY = wrapText(ctx, bullet, 158, cursorY, width - 450, 38) + 16;
    }
  }

  ctx.fillStyle = "rgba(237, 233, 247, 0.4)";
  ctx.font = "500 20px Inter, sans-serif";
  ctx.fillText(`${index + 1} / ${total}`, width - 140, height - 60);
}

export function renderTextSlides(contents: TextSlideContent[]): string[] {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;

  return contents.map((content, i) => {
    renderTextSlide(canvas, content, i, contents.length);
    return canvas.toDataURL("image/png");
  });
}
