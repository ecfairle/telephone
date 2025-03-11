import {createShuff, fetchGames, getRoomies, getRooms, getShuffleGames} from '@/lib/data';
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import Lobby from "@/app/(game)/lobby";
import RoomSelector from "@/app/(game)/room_selector";
import {User} from "@/lib/data_definitions";
import JoinRoom from "@/app/(game)/join_room/[room_id]/join";
import React from "react";
import GamePanels from "@/app/(game)/game_panels";
import {Button} from "@/components/button";
import Pull from "@/app/(game)/shuffle/pull";

export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    const userId = session.user.userId;
    const games = await getShuffleGames(userId);
    console.log('gggg' + games[0]);
    return (
        <div>
            <Pull/>
            {games.map((gameId, idx) => (
                <div key={idx}>
                    <GamePanels userColors={{}} userId={userId} gameId={gameId}/>
                </div>
            ))}
        </div>
    )
}