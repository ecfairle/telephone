'use client'
import {Button} from "@/components/button";
import {getRoomById, joinRoom} from '@/lib/api'
import {redirect} from "next/navigation";
import {useEffect, useState} from "react";
import {User} from "@/lib/data_definitions";

export default function JoinRoom({userId, roomId} : {userId:string, roomId: string}) {
    console.log('room + user -- '+ roomId, userId)
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await getRoomById(roomId);
                const result : {roomies: User[], room_id: string} = await res.json();
                if (result.roomies.length > 0) {
                    setIsLoading(false);
                } else {
                    setError('Invalid room id');
                }
            } catch(error) {
                console.log('error' + error);
                setError('Invalid room id');
            }
        }
        fetchRoomData();
        }, []);
    return (
        <main className={'m-5'}>
            {!isLoading ?
                <div>
                    <Button onClick={async () => {

                        const res = await joinRoom(userId, roomId);
                        try {
                            if (!res.ok) {
                                const data = await res.json();
                                if (data === null || data === undefined) {
                                    setError('Database error.')
                                } else {
                                    setError(data);
                                }
                                return;
                            }
                        } catch {
                            setError('Failed to join room');
                            return;
                        }
                        redirect('/');
                    }}>Join Room</Button>
                </div>
                : null}
            <p>{error}</p>
        </main>
    )
}