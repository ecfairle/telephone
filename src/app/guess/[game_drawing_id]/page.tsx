import { reserveGameGuess } from '@/lib/data';
import { Metadata } from 'next';
import {getSignedUrl} from "@/lib/gcs";
import Guess from "@/app/guess/[game_drawing_id]/guess";

export const metadata: Metadata = {
    title: 'Guess',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ game_drawing_id: string }> }) {


    const gameDrawingId = (await params).game_drawing_id;
    console.log(gameDrawingId);
    const userId = '0fd40421-dc18-46ca-b19a-68f853e8ddc4';
    const drawing = await reserveGameGuess(gameDrawingId, userId);

    return (
        <main>
            {drawing ?
                <Guess gameDrawing={drawing} imageUrl={await getSignedUrl(drawing.prev_game_drawing_id)}/>
                : "Not your turn in this game"}
        </main>
    );
}