import {NextRequest} from "next/server";
import {startNewGameFromOld} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const oldGameId = loadedParams.old_game_id;
    await startNewGameFromOld(oldGameId);
    return Response.json("Success");
}