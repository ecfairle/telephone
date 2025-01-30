import {fetchGames, getRoom} from '@/lib/data';
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import Lobby from "@/app/(game)/lobby";

export default async function Home() {
  // const params = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return redirect('/login')
  }
  const userId = session.user.userId;

  const {'room_id': roomId, users} = await getRoom(userId);
  const games = await fetchGames(userId, roomId);
  return (<Lobby roomId={roomId} users={users} gamesMap={games} userId={userId} />
    )
    }