import {NextRequest} from "next/server";
import {leaveRoom} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    const res = await leaveRoom(userId);
    if (res === null) {
        return Response.json("Failed to leave room", {status: 400})
    }
    return Response.json("Success");
}