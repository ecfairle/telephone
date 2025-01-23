import {NextRequest} from "next/server";
import {startNewGameForRoom} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const roomId = loadedParams.room_id;
    await startNewGameForRoom(roomId);
    return Response.json("Success");
}