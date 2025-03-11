import {QueryResult, sql} from '@vercel/postgres';
export async function POST() {
    try {
        const data = await sql`SELECT * FROM games`;
        const gameDrawings = await Promise.all(data.rows.map(async row => {
            const gdData = await sql`SELECT * FROM game_drawings where game_id=${row.id}`;
            return gdData.rows;
        }));
        return Response.json(gameDrawings.slice(0,4));

        const parseDrawings = async (gameDrawings) => {

        };
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}