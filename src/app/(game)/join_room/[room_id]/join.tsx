'use client'
import {Button} from "@/components/button";
import {joinRoom} from '@/lib/api'
import {redirect} from "next/navigation";

export default function JoinRoom({userId, roomId} : {userId:string, roomId: string}) {
    console.log('room + user -- '+ roomId, userId)
    return (
        <main>
            <Button onClick={async () => {

                await joinRoom(userId, roomId);
                redirect('/');
            }}>Join Room</Button>
        </main>
    )
}