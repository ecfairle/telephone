import { sql } from '@vercel/postgres';
import {
    GameDrawing,
} from './data_definitions';

export async function reserveGameDrawing(game_drawing_id:string, user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.* FROM game_drawings
            WHERE game_drawings.id = ${game_drawing_id}
              AND (game_drawings.drawer_id IS NULL or game_drawings.drawer_id=${user_id})
              AND game_drawings.drawing_done=false`;

        const res = data.rows;
        if (res.length === 0) {
            return null;
        }

        const gameDrawing = res[0];
        if (gameDrawing.drawer_id === null) {
            await sql<GameDrawing>`
            UPDATE game_drawings SET drawer_id=${user_id}
            WHERE game_drawings.id = ${game_drawing_id}
              AND (game_drawings.drawer_id is NULL)
              AND game_drawings.drawing_done = false`;
        }

        return gameDrawing;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch game drawings data.');
    }
}

export async function reserveGameGuess(game_drawing_id:string, user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.* FROM game_drawings
            WHERE game_drawings.id = ${game_drawing_id}
              AND (game_drawings.guesser_id IS NULL or game_drawings.guesser_id=${user_id})
              AND game_drawings.target_word IS NULL
              AND game_drawings.prev_game_drawing_id IS NOT NULL`;

        const res = data.rows;
        if (res.length === 0) {
            return null;
        }

        const gameDrawing = res[0];
        if (gameDrawing.guesser_id === null) {
            await sql<GameDrawing>`
            UPDATE game_drawings SET guesser_id=${user_id}
            WHERE game_drawings.id = ${game_drawing_id}`;
        }

        return gameDrawing;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch game drawings data.');
    }
}

export async function setDrawingDone(game_drawing_id:string) {
    try {
        await sql<GameDrawing>`
        UPDATE game_drawings SET drawing_done=true
        WHERE game_drawings.id = ${game_drawing_id}`;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update game_drawings record.');
    }
}

export async function setGuess(game_drawing_id:string, guess: string) {
    try {
        await sql<GameDrawing>`
        UPDATE game_drawings SET target_word=${guess}
        WHERE game_drawings.id = ${game_drawing_id}`;

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update game_drawings record.');
    }
}

export async function addDrawer(user_id:string, game_drawing_id:string) {
    try {
        await sql<GameDrawing>`
            UPDATE game_drawings SET drawer_id = ${user_id}
            WHERE game_drawings.id = ${game_drawing_id}
              AND game_drawings.target_word IS NOT NULL
              AND game_drawings.image IS NULL`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch revenue data.');
    }
}

export async function fetchAvailableDrawings(user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.* FROM game_drawings 
                    JOIN game_users on game_users.game_id = game_drawings.game_id
            WHERE game_users.user_id = ${user_id}
              AND (game_drawings.drawer_id IS NULL or game_drawings.drawer_id=${user_id})`;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}