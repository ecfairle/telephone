import {addDrawingImage} from '@/lib/data';
import {NextRequest} from "next/server";

export async function POST( request: NextRequest,
                            { body }: { body: Promise<{ image: string, user_id: string, game_drawing_id: string }>} ) {
    // console.log(await request.json());
    const loadedParams = await request.json();
    addDrawingImage(
        loadedParams.user_id,
        loadedParams.game_drawing_id,
        loadedParams.image);
    return Response.json("Success");
}