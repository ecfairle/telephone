import {NextRequest} from "next/server";
import {joinRoom} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const roomId = loadedParams.room_id;
    await joinRoom(userId, roomId);
    return Response.json("Success");
}