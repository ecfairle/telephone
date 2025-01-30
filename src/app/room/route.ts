import {fetchGames, getRoom} from "@/lib/data";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";


export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session?.user?.userId;
    const {'room_id': roomId, 'users': roomies} = await getRoom(userId);
    const games = await fetchGames(userId, roomId);

    return Response.json({
        room_id: roomId,
        roomies: roomies,
        games: games,
    });
}