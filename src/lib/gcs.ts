import {GetSignedUrlConfig, Storage} from "@google-cloud/storage";

function imagePath(gameDrawingId: string) {
    return `test/${gameDrawingId}.png`;
}

export async function getSignedUrl(
    gameDrawingId: string
) {
    if (!process.env.PRIVATE_KEY || !process.env.BUCKET_NAME) {
        throw new Error('No GCS configuration set up in this environment');
    }
    const storage = new Storage({
        projectId: process.env.PROJECT_ID,
        credentials: {
            client_email: process.env.CLIENT_EMAIL,
            private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        },
    });

    const bucket = storage.bucket(process.env.BUCKET_NAME);
    const file = bucket.file(imagePath(gameDrawingId));
    const options:GetSignedUrlConfig = {
        expires: Date.now() + 25 * 60 * 1000, // 25 minutes,
        action: 'read',
        version: 'v4'
    };
    const [response] = await file.getSignedUrl(options);
    return response;
}