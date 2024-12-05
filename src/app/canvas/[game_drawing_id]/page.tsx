import Canvas from './canvas';
import {fetchGameDrawing, addDrawingImage} from '@/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customers',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ game_drawing_id: string }> }) {
    const gameDrawingId = (await params).game_drawing_id;
    console.log(gameDrawingId);
    const drawings = await fetchGameDrawing('410544b2-4001-4271-9855-fec4b6a6442a', gameDrawingId);
    return (
        <main>
            {drawings.length > 0 ?
                <Canvas
                gameDrawingId={gameDrawingId}
                secretWord={drawings[0].target_word}/> : "Not your turn in this game"}
        </main>
    );
}