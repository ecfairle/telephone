import Canvas from './canvas';
import { reserveGameDrawing } from '@/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customers',
};

export default async function Page({
                                       params,
                                   }: {params: Promise<{ game_drawing_id: string }> }) {
    const gameDrawingId = (await params).game_drawing_id;
    console.log(gameDrawingId);
    const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
    const drawing = await reserveGameDrawing(gameDrawingId, userId);
    return (
        <main>
            {drawing ?
                <Canvas
                gameDrawingId={drawing.id}
                secretWord={drawing.target_word}/> : "Not your turn in this game"}
        </main>
    );
}