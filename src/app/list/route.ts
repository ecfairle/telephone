import { db } from "@vercel/postgres";

const client = await db.connect();

async function listGuessers() {
	const data = await client.sql`
    SELECT game_drawings.*
    FROM game_drawings
    WHERE target_word is NULL
    AND prev_game_drawing_id is not NULL;`
	return data.rows;
}
async function listDrawers() {
	const data = await client.sql`
    SELECT *
    FROM game_drawings
    WHERE drawer_id is NULL
    AND target_word is not NULL;`;

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