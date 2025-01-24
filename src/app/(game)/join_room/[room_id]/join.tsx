'use client'
import {Button} from "@/components/button";
import {joinRoom} from '@/lib/api'
import {redirect} from "next/navigation";
import {useState} from "react";

export default function JoinRoom({userId, roomId} : {userId:string, roomId: string}) {
    console.log('room + user -- '+ roomId, userId)
    const [error, setError] = useState('');
    return (
        <main>
            <Button onClick={async () => {

                const res = await joinRoom(userId, roomId);
                if (!res.ok) {
                    const data = await res.json();
                    if (data === null || data === undefined) {
                        setError('Database error.')
                    } else {
                        setError(data);
                    }
                    return;
                }
                redirect('/');
            }}>Join Room</Button>
            <p>{error}</p>

        </main>
    )
}