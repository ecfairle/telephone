import type { NextRequest } from 'next/server';
import {dateTimeAtPST, getAllShuffleGames, getShuffleGames, unreserveDrawing, unreserveGuess} from "@/lib/data";

export async function GET(request: NextRequest) {
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', {
    //         status: 401,
    //     });
    // }
    const shuffleGames = await getAllShuffleGames();
    for (const shuffleGame of shuffleGames) {
        if (!shuffleGame.available && shuffleGame.reserve_expired) {
            // todo: dont do this for sequences with too many turns already
            if (shuffleGame.draw_turn) {
                await unreserveDrawing(shuffleGame.id);
            }
            else {
                await unreserveGuess(shuffleGame.id);
            }
        }
    }

    return Response.json({ success: true });
}