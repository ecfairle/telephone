import {fetchGames, getRoom, getRoomById} from "@/lib/data";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import {User} from "@/lib/data_definitions";


export async function GET(request: Request, { params }: { params: Promise<{ room_id: string }> }) {
    const roomId = (await params).room_id;
    const users:User[] = await getRoomById(roomId);

    return Response.json({
        room_id: roomId,
        roomies: users,
    });
}