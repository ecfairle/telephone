import {setDrawingDone} from '@/lib/data';
import {NextRequest} from "next/server";

export async function POST(request: NextRequest) {
    // console.log(await request.json());
    const loadedParams = await request.json();
    await setDrawingDone(loadedParams.game_drawing_id);
    return Response.json("Success");
}