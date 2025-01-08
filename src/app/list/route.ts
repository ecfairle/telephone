import {db, sql} from "@vercel/postgres";

const client = await db.connect();

async function listGuessers() {
	const data = await client.sql`
    SELECT gd.*, gd_guessers.users, gd_drawers.users
    FROM game_drawings gd
    LEFT JOIN (
        SELECT game_id, array_agg(guesser_id) as users
        FROM game_drawings
        GROUP BY game_id
	) gd_guessers
    ON gd.game_id = gd_guessers.game_id
	LEFT JOIN (
		SELECT game_id, array_agg(drawer_id) as users
		FROM game_drawings
		GROUP BY game_id
	) gd_drawers
	ON gd.game_id = gd_drawers.game_id
    WHERE gd.target_word is NULL
    AND gd.prev_game_drawing_id is not NULL`
	return data.rows;
}
async function listDrawers() {
	const data = await client.sql`
		SELECT gd.*, gd_guessers.*, gd_drawers.*
		FROM game_drawings gd
				 LEFT JOIN (
			SELECT game_id, array_agg(guesser_id) as users
			FROM game_drawings
			WHERE guesser_id IS NOT NULL
			GROUP BY game_id
		) gd_guessers
		ON gd.game_id = gd_guessers.game_id
		LEFT JOIN (
			SELECT game_id, array_agg(drawer_id) as users
			FROM game_drawings
			GROUP BY game_id
		) gd_drawers
						   ON gd.game_id = gd_drawers.game_id
		WHERE (gd.drawer_id is NULL OR gd.drawing_done=false)
		AND gd.target_word is not NULL;`

	return data.rows;
}

async function listGames() {
	const data = await sql`
            SELECT g.*, users.name FROM game_users g
                    JOIN game_users g2 on g2.game_id = g.game_id
					JOIN users on users.id = g2.user_id
            WHERE g.user_id = '410544b2-4001-4271-9855-fec4b6a6442a'`;
	return data.rows;
}

export async function GET() {
    try {
		const guessers = await listGuessers();
		const drawers = await listDrawers();
		const games = await listGames();
    	return Response.json({guessers, drawers, games});
    } catch (error) {
    	return Response.json({ error }, { status: 500 });
    }
}