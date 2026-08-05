/**
 * Single source of truth for the five camera vantages and their
 * resolved silhouettes. Consumed by the build-time fragment generator,
 * the live canvas, the HUD, and the guided tour.
 */

export const VANTAGE_COUNT = 5;
export const SCENE_RADIUS = 6;
export const CAMERA_DISTANCE = 11;
export const CAMERA_FOV = 50;

export type VantageId = 0 | 1 | 2 | 3 | 4;

export interface Vantage {
  id: VantageId;
  /** Azimuth around the Y axis, degrees. 0 = +Z, increasing counter-clockwise seen from above. */
  azimuthDeg: number;
  /** Elevation above the horizon, degrees. */
  elevationDeg: number;
  /** Short machine label shown in the HUD. */
  code: string;
  /** Human label. */
  label: string;
  /** Route this vantage enters. */
  route: string;
}

/**
 * Azimuths are spread so no two resolved vantages are adjacent:
 * a visitor always passes through genuine noise between meanings.
 */
export const VANTAGES: readonly Vantage[] = [
  {
    id: 0,
    azimuthDeg: 0,
    elevationDeg: 10,
    code: "V0",
    label: "IDENTITY",
    route: "/about",
  },
  {
    id: 1,
    azimuthDeg: 68,
    elevationDeg: 14,
    code: "V1",
    label: "WORK",
    route: "/work",
  },
  {
    id: 2,
    azimuthDeg: 142,
    elevationDeg: 8,
    code: "V2",
    label: "PROCESS",
    route: "/process",
  },
  {
    id: 3,
    azimuthDeg: 222,
    elevationDeg: 12,
    code: "V3",
    label: "SIGNALS",
    route: "/notes",
  },
  {
    id: 4,
    azimuthDeg: 296,
    elevationDeg: 18,
    code: "V4",
    label: "CONTACT",
    route: "/contact",
  },
] as const;

export function vantageCameraPosition(v: Vantage, distance = CAMERA_DISTANCE): {
  x: number;
  y: number;
  z: number;
} {
  const az = (v.azimuthDeg * Math.PI) / 180;
  const el = (v.elevationDeg * Math.PI) / 180;
  return {
    x: distance * Math.cos(el) * Math.sin(az),
    y: distance * Math.sin(el),
    z: distance * Math.cos(el) * Math.cos(az),
  };
}
