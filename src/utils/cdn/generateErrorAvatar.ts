import { createCanvas, loadImage } from "canvas";

type OverlayErrorOptions = {
    errorText?: string;
    font?: string;
    textColor?: string;
    imagePath: string;
};

export async function generateErrorAvatar({
    errorText = 'Invalid Username',
    font = 'bold 24px Arial',
    textColor = '#ff4444',
    imagePath,
}: OverlayErrorOptions): Promise<Buffer> {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    // Draw base image
    ctx.drawImage(img, 0, 0, img.width, img.height);
    // Draw error text
    ctx.fillStyle = textColor;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(errorText, img.width / 2, img.height / 2);
    // ctx.fillText(errorText, img.width / 2, img.height - 100);

    return canvas.toBuffer('image/png');
}