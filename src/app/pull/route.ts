import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import {pullShuffle} from "@/lib/data";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return Response.json("Invalid session", {status: 400});
    }
    const userId = session.user.userId;
    try {
        const res = await pullShuffle(userId);
        return Response.json('!');
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}