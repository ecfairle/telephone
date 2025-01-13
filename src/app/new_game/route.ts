import {NextRequest} from "next/server";
import {startNewGameFromUser} from "@/lib/data";

export async function POST(
    request: NextRequest
) {
    const loadedParams = await request.json();
    const userId = loadedParams.user_id;
    await startNewGameFromUser(userId);
    return Response.json("Success");
}