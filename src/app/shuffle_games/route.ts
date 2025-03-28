import {getShuffleGames} from "@/lib/data";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";


export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session?.user?.userId;
    const games = await getShuffleGames(userId);

    return Response.json(games);
}