import { sql } from '@vercel/postgres';
import {
    GameDrawing,
} from './data_definitions';
export async function fetchGameDrawing(user_id:string, game_drawing_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.*, d_users.name as drawer_name, g_users.name as guesser_name FROM game_drawings
                                                                                                       LEFT JOIN users d_users on d_users.id = game_drawings.drawer_id
                                                                                                       LEFT JOIN users g_users on g_users.id = game_drawings.guesser_id
            WHERE game_drawings.drawer_id = ${user_id}
              AND game_drawings.id = ${game_drawing_id}
              AND game_drawings.target_word IS NOT NULL
              AND game_drawings.image IS NULL`;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch game drawings data.');
    }
}

export async function addDrawingImage(user_id:string, game_drawing_id:string, image_url:string) {
    try {
        await sql<GameDrawing>`
            UPDATE game_drawings SET image = ${image_url}
            WHERE game_drawings.drawer_id = ${user_id}
              AND game_drawings.id = ${game_drawing_id}
              AND game_drawings.target_word IS NOT NULL
              AND game_drawings.image IS NULL`;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch revenue data.');
    }
}

export async function fetchGames(user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.*, ENCODE(game_drawings.image,'base64') as base64_image, d_users.name as drawer_name, g_users.name as guesser_name FROM game_drawings 
                     LEFT JOIN users d_users on d_users.id = game_drawings.drawer_id
                     LEFT JOIN users g_users on g_users.id = game_drawings.guesser_id
            WHERE drawer_id = ${user_id}
              AND game_drawings.target_word IS NOT NULL`;
        return data.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}