import {NextRequest} from "next/server";
import {joinRoom} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const roomId = loadedParams.room_id;
    const res = await joinRoom(userId, roomId);
    if (res === null) {
        return Response.json("Too many users in room", {status: 400})
    }
    return Response.json("Success");
}