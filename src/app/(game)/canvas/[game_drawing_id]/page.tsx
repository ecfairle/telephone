import Canvas from './canvas';
import {reserveGameDrawing} from '@/lib/data';
import { Metadata } from 'next';
import {getServerSession} from 'next-auth'
import {authOptions} from '@/app/api/auth/[...nextauth]/auth'
import SessionProvider from "@/providers/SessionProvider";
import {redirect} from 'next/navigation';

export const metadata: Metadata = {
    title: 'Canvas',
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
    const drawing = await reserveGameDrawing(gameDrawingId, userId);
    return (
        <SessionProvider session={session}>
            {drawing ?
                <Canvas
                gameDrawingId={drawing.id}
                secretWord={drawing.target_word}/> : "Not your turn in this game"}
        </SessionProvider>
    );
}