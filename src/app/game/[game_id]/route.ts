import {fetchAvailableDrawings} from "@/lib/data";


export async function GET(
    request: Request, { params }: { params: Promise<{ game_id: string }> }
) {
    const gameId = (await params).game_id;
    if (gameId === undefined) {
        return Response.json("Failed to get game", {status: 400});
    }
    if (Array.isArray(gameId)) {
        return Response.json("Failed to get game", {status: 400});
    }
    const drawings = await fetchAvailableDrawings([gameId]);
    return Response.json({drawings: drawings.drawings, next_players: drawings.nextPlayers});
}