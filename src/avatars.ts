export function parseAvatar(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 2_000_000 && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) ? value : undefined;
}
export function centredSquare(width: number, height: number) {
  const side = Math.min(width, height);
  if (!(side > 0)) throw new Error('图片尺寸无效。');
  return { x: (width - side) / 2, y: (height - side) / 2, side };
}
export async function cropAvatar(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片。');
  if (file.size > 15 * 1024 * 1024) throw new Error('图片不能超过 15 MB。');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    await image.decode();
    const crop = centredSquare(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(512, crop.side);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法处理图片，请重试。');
    context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.9);
  } finally { URL.revokeObjectURL(url); }
}
