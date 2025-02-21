import {NextRequest} from "next/server";
import {createRoom, getRooms} from "@/lib/data";

const MAX_ROOMS = 5;

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const userRooms = await getRooms(userId);
    if (userRooms.length >= MAX_ROOMS) {
        return Response.json("Too many rooms", {status: 400})
    }
    const room = await createRoom(userId);
    if (room === null) {
        return Response.json("Failed to create room", {status: 400})
    }

    return Response.json(room.id);
}