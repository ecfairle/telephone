import { NextRequest } from "next/server";
import {unreserveShuffle} from "@/lib/data";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";

export async function POST(request: NextRequest) {
    const loadedParams = await request.json();
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session.user.userId;
    console.log(`QStash -- Message game_id:${loadedParams.shuffleGameId} loaded`);
    await unreserveShuffle(loadedParams.shuffleGameId, userId);
    return Response.json('success');
}