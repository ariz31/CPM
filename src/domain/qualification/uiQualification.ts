export interface VirtualWindowInput {
  totalRows: number;
  scrollTop: number;
  rowHeight: number;
  viewportHeight: number;
  overscan: number;
}

export interface VirtualWindowResult {
  startIndex: number;
  endIndex: number;
  renderedRows: number;
  topSpacer: number;
  bottomSpacer: number;
}

export function calculateVirtualWindow(input: VirtualWindowInput): VirtualWindowResult {
  const totalRows = Math.max(0, Math.floor(input.totalRows));
  const rowHeight = Math.max(1, input.rowHeight);
  const viewportHeight = Math.max(rowHeight, input.viewportHeight);
  const overscan = Math.max(0, Math.floor(input.overscan));
  const maximumStart = Math.max(0, totalRows - 1);
  const firstVisible = Math.min(maximumStart, Math.max(0, Math.floor(input.scrollTop / rowHeight)));
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(totalRows, firstVisible + visibleCount + overscan);
  return {
    startIndex,
    endIndex,
    renderedRows: Math.max(0, endIndex - startIndex),
    topSpacer: startIndex * rowHeight,
    bottomSpacer: Math.max(0, (totalRows - endIndex) * rowHeight)
  };
}

export interface TouchTargetMeasurement {
  name: string;
  width: number;
  height: number;
}

export interface TouchTargetFinding extends TouchTargetMeasurement {
  requiredSize: number;
}

export function findUndersizedTouchTargets(targets: TouchTargetMeasurement[], requiredSize = 44): TouchTargetFinding[] {
  return targets
    .filter((target) => target.width < requiredSize || target.height < requiredSize)
    .map((target) => ({ ...target, requiredSize }));
}

export function qualifiesTenThousandRowViewport(scrollTop: number): boolean {
  const result = calculateVirtualWindow({
    totalRows: 10_000,
    scrollTop,
    rowHeight: 46,
    viewportHeight: 540,
    overscan: 7
  });
  return result.renderedRows <= 27 && result.startIndex >= 0 && result.endIndex <= 10_000;
}
