import {fetchAvailableDrawings, getAllShuffleGames} from "@/lib/data";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import { GameDrawing } from "@/lib/data_definitions";
import { NextRequest } from "next/server";


export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }

    const searchParams = request.nextUrl.searchParams;
    const offset = searchParams.get('offset');
    const limit = searchParams.get('limit');
    console.log('limit', limit, 'offset', offset)
    if (!offset || !limit) {
        return Response.json("Invalid offset or limit", {status: 400});
    }

    
    const userId = session?.user?.userId;
    const games = await getAllShuffleGames(userId, Number(offset), Number(limit));
    const allGameData = await fetchAvailableDrawings(games.map((game:GameDrawing)=>game.game_id), false)

    return Response.json(allGameData);
}