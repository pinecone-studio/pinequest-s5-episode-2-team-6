/** A tiny mutable channel between the 3D scene and the DOM overlays.
 *
 * The scene writes the projected screen position of the selected structure every
 * frame it redraws; the info card reads it from its own animation frame. Keeping
 * the position out of React state means orbiting the model never re-renders the
 * React tree. */

export interface ScreenAnchor {
  id: string | null;
  x: number;
  y: number;
  visible: boolean;
}

export type AnchorListener = (anchor: ScreenAnchor) => void;

export class AnchorChannel {
  readonly current: ScreenAnchor = {id: null, x: 0, y: 0, visible: false};
  private listeners = new Set<AnchorListener>();

  update(id: string | null, x: number, y: number, visible: boolean): void {
    const now = this.current;
    if (now.id === id && now.x === x && now.y === y && now.visible === visible) return;
    now.id = id;
    now.x = x;
    now.y = y;
    now.visible = visible;
    for (const listener of this.listeners) listener(now);
  }

  subscribe(listener: AnchorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
