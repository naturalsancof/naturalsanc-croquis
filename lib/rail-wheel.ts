/** 桌面滚轮在轨道上时改成横向拨卡片；手机触控和「想滚动页面」的手势不拦截。 */
export function railWheelDecision(input: {
  deltaX: number;
  deltaY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  coarsePointer: boolean;
  cardCount: number;
}): "scrub" | "ignore" {
  if (input.coarsePointer || input.cardCount < 2) return "ignore";
  if (input.ctrlKey || input.metaKey) return "ignore";
  // Shift + 滚轮：故意滚动页面
  if (input.shiftKey) return "ignore";

  const absX = Math.abs(input.deltaX);
  const absY = Math.abs(input.deltaY);
  const delta = absX > absY ? input.deltaX : input.deltaY;
  if (Math.abs(delta) < 2) return "ignore";
  return "scrub";
}

export function railWheelDelta(deltaX: number, deltaY: number) {
  return Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
}
