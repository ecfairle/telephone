import { Metadata } from 'next';
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import {redirect} from "next/navigation";
import JoinRoom from "./join";
import {getRooms} from "@/lib/data";

export const metadata: Metadata = {
    title: 'Join Room',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ room_id: string }> }) {


    const roomId = (await params).room_id;
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect(`/login?room_id=${roomId}`)
    }
    console.log('room id ?' + roomId)
    const userId = session.user.userId;
    const roomsData = await getRooms(userId);
    const inRoom = roomsData.some((room) => room.room_id === roomId);
    if (inRoom) {
        return redirect('/');
    }
    return (
        <div>
        <JoinRoom roomId={roomId} userId={userId || ""}/>
        </div>
    );
}