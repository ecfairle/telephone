import {setGuess} from '@/lib/data';
import {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";

export async function POST(request: NextRequest) {
    const loadedParams = await request.json();
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session.user.userId;
    if (loadedParams.guess === null || loadedParams.guess === undefined) {
        return Response.json("Invalid guess", {status: 400});
    }
    const guess = loadedParams.guess.toLowerCase().trim();
    if (guess.length < 2 || guess.length > 20 || !guess.match(/^[a-z\s]+$/)) {
        return Response.json("Invalid guess", {status: 400});
    }
    await setGuess(userId, loadedParams.game_drawing_id, guess);
    return Response.json("Success");
}