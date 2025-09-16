"use client"
import {Button} from "@/components/button";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import {createRoom} from "@/lib/api";
import {useState} from "react";

const MAX_ROOMS = 5;

export default function RoomSelector({userRooms, roomId} : {userRooms: { room_id: string }[], roomId?: string|null}) {
    async function handleNewRoomClick() {
        try {
            setNewRoomEnabled(false);
            const res = await createRoom(session?.user.userId as string);
            const room_id = await res.json();
            if (res.ok) {
                router.push(`/room/${room_id}`);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const router = useRouter();
    const [newRoomEnabled, setNewRoomEnabled] = useState(userRooms.length < MAX_ROOMS);
    const { data: session } = useSession();
    if (!session?.user.userId) {
        router.push("/login");
        return;
    }
    return (
        <div className={"mb-2"}>
            <div className={"mr-6 float-left block"}>
                <Button
                disabled={!newRoomEnabled}
                onClick={handleNewRoomClick}>New Room</Button>
        {userRooms.map((room,idx) => (
            <div key={room.room_id} className={"w-full mt-5"}>
            <Button
                disabled={room.room_id === roomId}
                
                className={'mr-2 w-32'}
                onClick={() => {router.push(`/room/${room.room_id}`)}}>
                    Room {idx + 1}
            </Button>
            </div>
        ))}
            </div>
        </div>
    )
}