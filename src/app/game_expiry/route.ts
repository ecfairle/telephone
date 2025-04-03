import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextRequest } from "next/server";
import {unreserveShuffle} from "@/lib/data";

async function handler(request: NextRequest) {
    const loadedParams = await request.json();
    console.log(`QStash -- Message game_id:${loadedParams.shuffleGameId} loaded`);
    await unreserveShuffle(loadedParams.shuffleGameId);
    return Response.json('success');
}

// wrap the handler with the verifier
export const POST = verifySignatureAppRouter(handler);