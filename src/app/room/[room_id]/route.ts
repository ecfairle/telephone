import {fetchGames, getRoomies} from "@/lib/data";
import {User} from "@/lib/data_definitions";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";


export async function GET(request: Request, { params }: { params: Promise<{ room_id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session?.user?.userId;
    const roomId = (await params).room_id;
    const users:User[] = await getRoomies(roomId);
    const games = await fetchGames(userId, roomId);

    return Response.json({
        room_id: roomId,
        roomies: users,
        games: games,
    });
}