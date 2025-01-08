import Canvas from './canvas';
import {reserveGameDrawing} from '@/lib/data';
import { Metadata } from 'next';
import {getServerSession} from 'next-auth'
import {authOptions} from '@/app/api/auth/[...nextauth]/route'
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
    if (!session) {
        return redirect('/login')
    }
    console.log('sdui----' + session?.user?.id)
    const userId = '0fd40421-dc18-46ca-b19a-68f853e8ddc4';
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