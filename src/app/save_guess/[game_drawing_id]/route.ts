import {setDrawingDone, setGuess} from '@/lib/data';
import {NextRequest} from "next/server";

export async function POST(request: NextRequest) {
    // console.log(await request.json());
    const loadedParams = await request.json();
    await setGuess(loadedParams.game_drawing_id, loadedParams.guess);
    return Response.json("Success");
}