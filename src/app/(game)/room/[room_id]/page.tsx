import {fetchGames, getRoomies, getRooms} from '@/lib/data';
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import Lobby from "@/app/(game)/lobby";
import RoomSelector from "@/app/(game)/room_selector";

export default async function Home({
                                       params,
                                   }: {params: Promise<{ room_id: string }> }) {
    const roomId = (await params).room_id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    const userId = session.user.userId;
    const roomUsers = await getRoomies(roomId);
    const userRooms = await getRooms(userId);
    const games = await fetchGames(userId, roomId);
    return (
        <div>
            <RoomSelector userRooms={userRooms} roomId={roomId} />
            <Lobby roomId={roomId} users={roomUsers} gamesMap={games} userId={userId} />
        </div>
    )
}