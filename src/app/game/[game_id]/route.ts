import {NextRequest} from "next/server";
import {fetchAvailableDrawings} from "@/lib/data";
import {NextApiRequest} from "next";


export async function GET(
    request: Request, { params }: { params: Promise<{ slug: string }> }
) {
    const gameId = (await params).game_id;
    if (gameId === undefined) {
        return Response.json("Failed to get game", {status: 400});
    }
    if (Array.isArray(gameId)) {
        return Response.json("Failed to get game", {status: 400});
    }
    const drawings = await fetchAvailableDrawings([gameId]);
    return Response.json({drawings});
}