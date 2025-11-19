/**
 * Analyzes an image to determine its transparency and optimal background color.
 */

export interface ImageAnalysisResult {
    hasTransparency: boolean;
    isDark: boolean;
    suggestedBackground: 'dark' | 'light' | 'checkerboard';
    averageLuminance: number;
}

export const analyzeImage = (imageSrc: string): Promise<ImageAnalysisResult> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                // Limit size for performance
                const MAX_SIZE = 100;
                let width = img.width;
                let height = img.height;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                let totalLuminance = 0;
                let opaquePixelCount = 0;
                let transparentPixelCount = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a < 10) { // Consider almost fully transparent pixels as transparent
                        transparentPixelCount++;
                    } else {
                        // Calculate luminance (perceived brightness)
                        // Formula: 0.299*R + 0.587*G + 0.114*B
                        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                        totalLuminance += luminance;
                        opaquePixelCount++;
                    }
                }

                const totalPixels = width * height;
                const hasTransparency = transparentPixelCount > (totalPixels * 0.05); // >5% transparency

                let averageLuminance = 0;
                if (opaquePixelCount > 0) {
                    averageLuminance = totalLuminance / opaquePixelCount;
                }

                const isDark = averageLuminance < 128;

                // Logic for suggested background
                let suggestedBackground: 'dark' | 'light' | 'checkerboard' = 'checkerboard';

                if (hasTransparency) {
                    if (isDark) {
                        suggestedBackground = 'light'; // Dark subject needs light bg
                    } else {
                        suggestedBackground = 'dark'; // Light subject needs dark bg
                    }
                } else {
                    // No transparency, background doesn't matter as much for visibility, 
                    // but for aesthetics we might want a border or shadow.
                    // We'll default to checkerboard (which will be hidden by the image mostly) 
                    // or just a neutral background in the UI.
                    suggestedBackground = 'checkerboard';
                }

                resolve({
                    hasTransparency,
                    isDark,
                    suggestedBackground,
                    averageLuminance
                });

            } catch (error) {
                reject(error);
            }
        };

        img.onerror = (err) => reject(err);
    });
};
