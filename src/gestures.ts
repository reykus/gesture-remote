// Pose heuristics built on MediaPipe's 21-point hand landmark model.
// Landmark indices: 0 wrist, 4 thumb tip, 8 index tip, 12 middle tip,
// 16 ring tip, 20 pinky tip, 5/9/13/17 finger MCP (knuckle) joints.

export type Point = { x: number; y: number; z: number };
export type Hand = Point[];

const dist = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.5);

export function handScale(hand: Hand): number {
  return dist(hand[0], hand[9]) || 0.001;
}

export function palmCenter(hand: Hand): Point {
  const ids = [0, 5, 9, 13, 17];
  const sum = ids.reduce(
    (acc, i) => ({ x: acc.x + hand[i].x, y: acc.y + hand[i].y, z: acc.z + hand[i].z }),
    { x: 0, y: 0, z: 0 }
  );
  return { x: sum.x / ids.length, y: sum.y / ids.length, z: sum.z / ids.length };
}

function isFingerExtended(hand: Hand, tip: number, pip: number, mcp: number): boolean {
  const wrist = hand[0];
  return dist(wrist, hand[tip]) > dist(wrist, hand[mcp]) * 1.15 && dist(wrist, hand[tip]) > dist(wrist, hand[pip]);
}

const FINGERS: [number, number, number][] = [
  [8, 6, 5], // index
  [12, 10, 9], // middle
  [16, 14, 13], // ring
  [20, 18, 17], // pinky
];

function extendedFlags(hand: Hand): boolean[] {
  return FINGERS.map(([tip, pip, mcp]) => isFingerExtended(hand, tip, pip, mcp));
}

export function extendedFingerCount(hand: Hand): number {
  const thumbOut = dist(hand[4], hand[17]) > handScale(hand) * 1.3;
  return extendedFlags(hand).filter(Boolean).length + (thumbOut ? 1 : 0);
}

export function isOpenPalm(hand: Hand): boolean {
  return extendedFingerCount(hand) >= 4;
}

export function isFist(hand: Hand): boolean {
  // Deliberately ignores the thumb: in a relaxed fist the thumb often
  // rests to the side rather than tucked in, which made the old
  // "count === 0 including thumb" check miss real fists intermittently.
  return extendedFlags(hand).every((extended) => !extended);
}

/** True when only the index finger is extended — the "pointing" pose. */
export function isPointing(hand: Hand): boolean {
  const [index, middle, ring, pinky] = extendedFlags(hand);
  return index && !middle && !ring && !pinky;
}

/**
 * Mirrors a hand horizontally so gesture logic can work in "what the
 * presenter sees in a mirror" space: moving a hand to your own right
 * increases x, exactly like a real mirror (front camera video is not
 * mirrored by the hardware, so this flip has to happen in software).
 */
export function mirrorHand(hand: Hand): Hand {
  return hand.map((p) => ({ ...p, x: 1 - p.x, y: p.y, z: p.z }));
}
