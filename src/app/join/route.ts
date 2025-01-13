import {NextRequest} from "next/server";
import {joinGame} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const gameId = loadedParams.game_id;
    const row = await joinGame(userId, gameId);
    if (row === null) {
        return Response.json({message: "User already joined the game"}, {status: 400});
    }
    return Response.json("Success");
}