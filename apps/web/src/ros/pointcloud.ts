export type PointCloud2 = {
  height: number;
  width: number;
  fields: Array<{ name: string; offset: number; datatype: number; count: number }>;
  is_bigendian: boolean;
  point_step: number;
  row_step: number;
  data: string | number[];
  is_dense: boolean;
};

function decodeBase64(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getFieldOffset(fields: PointCloud2["fields"], name: string): number | null {
  const field = fields.find((f) => f.name === name);
  return field ? field.offset : null;
}

export function decodePointCloud2(msg: PointCloud2, maxPoints = 50000): Float32Array {
  const xOffset = getFieldOffset(msg.fields, "x");
  const yOffset = getFieldOffset(msg.fields, "y");
  const zOffset = getFieldOffset(msg.fields, "z");

  if (xOffset === null || yOffset === null || zOffset === null) {
    return new Float32Array();
  }

  const raw = Array.isArray(msg.data) ? new Uint8Array(msg.data) : decodeBase64(msg.data);
  const totalPoints = msg.width * msg.height;
  const step = msg.point_step;
  const stride = Math.max(1, Math.floor(totalPoints / maxPoints));
  const points = new Float32Array(Math.ceil(totalPoints / stride) * 3);
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  const littleEndian = !msg.is_bigendian;

  let idx = 0;
  for (let i = 0; i < totalPoints; i += stride) {
    const base = i * step;
    const x = view.getFloat32(base + xOffset, littleEndian);
    const y = view.getFloat32(base + yOffset, littleEndian);
    const z = view.getFloat32(base + zOffset, littleEndian);

    points[idx] = x;
    points[idx + 1] = y;
    points[idx + 2] = z;
    idx += 3;
  }

  return points.slice(0, idx);
}
