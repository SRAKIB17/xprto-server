import { createCanvas } from 'canvas';

interface CaptchaOptions {
    width?: number;
    height?: number;
    length?: number;
    font?: string;
    bgColor?: string;
    textColor?: string;
    noiseLines?: number;
    charSpacing?: number;
    characters?: string;
    addDots?: boolean;
}

interface CaptchaResult {
    image: Buffer;
    text: string;
    base64: string;
}

export function generateCaptcha(options: CaptchaOptions = {}): CaptchaResult {
    const width = options.width ?? 200;
    const height = options.height ?? 70;
    const length = options.length ?? 6;
    const font = options.font ?? 'bold 40px sans-serif';
    const bgColor = options.bgColor ?? '#f2f2f2';
    const textColor = options.textColor ?? '#000000';
    const noiseLines = options.noiseLines ?? 4;
    const charSpacing = options.charSpacing ?? 30;
    const characters = options.characters ?? 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const addDots = options.addDots ?? true;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Generate random text
    const text = Array.from({ length }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length))
    ).join('');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw text with random rotation
    ctx.font = font;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const angle = (Math.random() - 0.5) * 0.8;
        ctx.save();
        ctx.fillStyle = textColor;
        ctx.translate(20 + i * charSpacing, height / 2);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 10);
        ctx.restore();
    }

    // Draw noise lines
    for (let i = 0; i < noiseLines; i++) {
        ctx.strokeStyle = randomColor();
        ctx.beginPath();
        ctx.moveTo(rand(0, width), rand(0, height));
        ctx.lineTo(rand(0, width), rand(0, height));
        ctx.stroke();
    }

    // Add noise dots
    if (addDots) {
        for (let i = 0; i < 10000; i++) {
            ctx.fillStyle = randomColor();
            ctx.fillRect(rand(0, width), rand(0, height), 1, 1);
        }
    }

    const buffer = canvas.toBuffer('image/png');
    const base64 = canvas.toDataURL();

    return { image: buffer, text, base64 };
}

// Helpers
function randomColor(): string {
    return `rgb(${rand(0, 255)},${rand(0, 255)},${rand(0, 255)})`;
}

function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
