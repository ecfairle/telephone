import {NextRequest} from "next/server";
import {getRoomies, joinRoom} from "@/lib/data";

const MAX_PEOPLE_PER_ROOM = 5;

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const roomId = loadedParams.room_id;
    const roomies = await getRoomies(roomId);
    if (roomies.rows.length === 0) {
        return Response.json("Room not found", {status: 404})
    }
    if (roomies.rows.length >= MAX_PEOPLE_PER_ROOM) {
        return Response.json("Too many users in room", {status: 400})
    }
    const res = await joinRoom(userId, roomId);
    if (res === null) {
        return Response.json("Failed to join room", {status: 400})
    }
    return Response.json("Success");
}