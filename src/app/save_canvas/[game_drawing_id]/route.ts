import {setDrawingDone} from '@/lib/data';
import {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";

export async function POST(request: NextRequest) {
    // console.log(await request.json());
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session.user.userId;
    const loadedParams = await request.json();
    await setDrawingDone(loadedParams.game_drawing_id, userId);
    return Response.json("Success");
}