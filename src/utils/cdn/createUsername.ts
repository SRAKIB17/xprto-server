import { createCanvas } from 'canvas';

type AvatarOptions = {
    username: string;
    size?: number;
    bgColor?: string;
    textColor?: string;
    font?: string;
};

export function generateUserAvatar({
    username,
    size = 128,
    bgColor = '#1b1f23',
    textColor = '#ffffff',
    font = 'bold 64px Arial'
}: AvatarOptions): Buffer {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background
    let x = (Math.floor(Math.random() * 10000000)).toString(16)?.slice(0, 6);
    // ctx.fillStyle = bgColor;
    ctx.fillStyle = `#${x}`;
    ctx.fillRect(0, 0, size, size);

    // Draw first letter
    const letter = (username?.trim()?.[0] || 'U').toUpperCase();
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, size / 2, size / 2);

    // Return buffer (you can stream or save this)
    return canvas.toBuffer('image/png');
}
