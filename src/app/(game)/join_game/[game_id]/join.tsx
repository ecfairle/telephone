'use client'
import {Button} from "@/components/button";
import {joinGame} from '@/lib/api'
import {redirect} from "next/navigation";

export default function JoinGame({userId, gameId} : {userId:string, gameId: string}) {
    console.log('game + user -- '+ gameId, userId)
    return (
        <main>
            <Button onClick={async () => {

                await joinGame(userId, gameId);
                redirect('/');
            }}>Join Game</Button>
        </main>
    )
}