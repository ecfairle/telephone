import { db } from "@vercel/postgres";

const client = await db.connect();

async function listGuessers() {
	const data = await client.sql`
    SELECT game_drawings.drawer_id,
           game_drawings.guesser_id
    FROM game_drawings
    WHERE game_drawings.guesser_id is not null AND game_drawings.image is not null AND game_drawings.target_word is null`;

	return data.rows;
}
async function listDrawers() {
	const data = await client.sql`
    SELECT game_drawings.drawer_id,
           game_drawings.target_word,
           game_drawings.next_id,
           game_drawings.image,
           game_drawings.guesser_id
    FROM game_drawings
    WHERE (game_drawings.drawer_id is not null AND game_drawings.target_word is not null AND game_drawings.image is null)`;

	return data.rows;
}

export async function GET() {
    try {
		const guessers = await listGuessers();
		const drawers = await listDrawers();
    	return Response.json({guessers, drawers});
    } catch (error) {
    	return Response.json({ error }, { status: 500 });
    }
}