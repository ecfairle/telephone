import {NextRequest} from "next/server";
import {createRoom} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const room = await createRoom(userId);
    if (room === null) {
        return Response.json("Failed to create room", {status: 400})
    }

    return Response.json(room.id);
}