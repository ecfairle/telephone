import {getAllShuffleGames, unreserveDrawing, unreserveGuess} from "@/lib/data";

export async function GET() {
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