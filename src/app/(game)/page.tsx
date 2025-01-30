import {getRoom} from '@/lib/data';
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

  const {'room_id': roomId} = await getRoom(session.user.userId);
  return (<Lobby roomId={roomId} userId={session.user.userId} />
    )
    }