"use client"
import {Button} from "@/components/button";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import {createRoom} from "@/lib/api";

export default function RoomSelector({userRooms, roomId} : {userRooms: { room_id: string }[], roomId: string|null}) {
    const router = useRouter();
    const { data: session } = useSession();
    if (!session?.user.userId) {
        router.push("/login");
        return;
    }
    return (
        <div className={"mb-2"}>
            <div className={"mr-6 float-left"}>
        {userRooms.map((room,idx) => (
            <Button
                disabled={room.room_id == roomId}
                key={idx}
                className={'mr-2'}
                onClick={() => {router.push(`/room/${room.room_id}`)}}>
                    Room {idx + 1}
            </Button>
        ))}
            </div>
            <Button onClick={async () => {
                const res = await createRoom(session.user.userId as string);
                const room_id = await res.json();
                router.push(`/room/${room_id}`)
            }}>New Room</Button>
        </div>
    )
}