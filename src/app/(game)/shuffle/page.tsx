import {getShuffleGames} from '@/lib/data';
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import React from "react";
import GamePanels from "@/app/(game)/game_panels";
import Pull from "@/app/(game)/shuffle/pull";

export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    const userId = session.user.userId;
    const games = await getShuffleGames(userId);
    const myTurnGames = games.filter(game => game.turnUser === userId);
    const pastGames = games.filter(game => game.turnUser !== userId);
    console.log('gggg' + games[0]);
    if (myTurnGames.length > 0) {
        if (myTurnGames[0].drawTurn) return redirect(`/canvas/${myTurnGames[0].id}`)
        else return redirect(`/guess/${myTurnGames[0].id}`)
    }
    return (
        <div>
            <Pull/>
            {myTurnGames.map((game, idx) => (
                <div key={idx}>
                    <GamePanels userColors={{}} userId={userId} gameId={game.game_id}/>
                </div>
            ))}
            {pastGames.map((game, idx) => (
                <div key={idx}>
                    <GamePanels userColors={{}} userId={userId} gameId={game.game_id}/>
                </div>
            ))}
        </div>
    )
}