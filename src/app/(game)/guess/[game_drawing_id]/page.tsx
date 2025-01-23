import {reserveGameGuess} from '@/lib/data';
import { Metadata } from 'next';
import {getSignedUrl} from "@/lib/gcs";
import Guess from "./guess";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import {redirect} from "next/navigation";

export const metadata: Metadata = {
    title: 'Guess',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ game_drawing_id: string }> }) {


    const gameDrawingId = (await params).game_drawing_id;
    console.log(gameDrawingId);
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
        return redirect('/login')
    }
    console.log('sdui----' + session?.user?.userId)
    const userId = session?.user?.userId;
    const drawing = await reserveGameGuess(gameDrawingId, userId);

    return (
        <main>
            {drawing ?
                <Guess gameDrawing={drawing} imageUrl={await getSignedUrl(drawing.prev_game_drawing_id)}/>
                : "Not your turn in this game"}
        </main>
    );
}