import { Metadata } from 'next';
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import {redirect} from "next/navigation";
import JoinGame from "./join";

export const metadata: Metadata = {
    title: 'Join Game',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ game_id: string }> }) {


    const gameId = (await params).game_id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    console.log('game id ?' + gameId)
    const userId = session.user.userId;

    return (
        <div>
        <JoinGame gameId={gameId} userId={userId || ""}/>
        </div>
    );
}