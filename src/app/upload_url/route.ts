import {NextRequest} from "next/server";
import { SignedPostPolicyV4Output } from "@google-cloud/storage";
import { Storage } from "@google-cloud/storage";
export async function POST(
    req: NextRequest, { body }: { body: Promise<{ image: string, user_id: string, game_drawing_id: string }>}
) {
    const loadedParams = await req.json();
    console.log(process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'));
    const storage = new Storage({
        projectId: process.env.PROJECT_ID,
        credentials: {
            client_email: process.env.CLIENT_EMAIL,
            private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        },
    });
    if (!process.env.BUCKET_NAME) {
        return new Response('Undefined bucket name', {
            status: 500,
        })
    }
    const bucket = storage.bucket(process.env.BUCKET_NAME);
    const file = bucket.file(loadedParams.file as string);
    const options = {
        expires: Date.now() + 5 * 60 * 1000, //  5 minutes,
        fields: { "x-goog-meta-source": "nextjs-project" },
    };
    const [response] = await file.generateSignedPostPolicyV4(options);
    return Response.json(response);
}