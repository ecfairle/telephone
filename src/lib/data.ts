import { sql } from '@vercel/postgres';
import { v4 } from "uuid";
import {
    Game,
    GameDrawing,
} from './data_definitions';
import { promises as fs } from 'fs';
import {getSignedUrl} from "@/lib/gcs";

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
        const allDrawings = await sql<GameDrawing>`
            SELECT * from game_drawings where game_id=${gameDrawing.game_id}`

        const drawersGuessers = allDrawings.rows.reduce((acc: Set<string>, curr: GameDrawing) => {
            acc.add(curr.guesser_id);
            acc.add(curr.drawer_id);
            return acc;
        }, new Set());

        if (user_id in drawersGuessers && gameDrawing.drawer_id === null) {
            return null;
        }
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
        const allDrawings = await sql<GameDrawing>`
            SELECT * from game_drawings where game_id=${gameDrawing.game_id}`

        const drawersGuessers = allDrawings.rows.reduce((acc: Set<string>, curr: GameDrawing) => {
            acc.add(curr.guesser_id);
            acc.add(curr.drawer_id);
            return acc;
        }, new Set());
        console.log(drawersGuessers, user_id, user_id in drawersGuessers)
        if (drawersGuessers.has(user_id) && gameDrawing.guesser_id === null) {
            return null;
        }
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
        const data = await sql<GameDrawing>`
        UPDATE game_drawings SET drawing_done=true
        WHERE game_drawings.id = ${game_drawing_id}
        RETURNING *`;
        const drawing = data.rows.length > 0 ? data.rows[0] : null;
        if (!drawing) {
            return null;
        }

        await sql<GameDrawing>`
        INSERT INTO game_drawings (id, game_id, prev_game_drawing_id, drawing_done)
        VALUES (${v4()}, ${drawing.game_id}, ${drawing.id}, false)`

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

export async function fetchGames(user_id:string) {
    try {
        const data = await sql`
            SELECT g.game_id, users.name FROM game_users g
                    LEFT JOIN game_users g2 on (g2.game_id = g.game_id AND g2.user_id != g.user_id)
					LEFT JOIN users on users.id = g2.user_id
            WHERE g.user_id = ${user_id}`;

        const result = data.rows.reduce(
            (prev, cur) => {
                if (cur.game_id in prev) {
                    return {...prev, [cur.game_id]: [...prev[cur.game_id], {'name': cur.name}]};
                } else {
                    return {...prev, [cur.game_id]: cur.name? [{'name': cur.name}] : []}
                }
            }, {}
        )
        return result;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function readWordList() {
    const fileName = "/src/data/word_list.txt"
    const file = await fs.readFile(process.cwd() + fileName, 'utf8');
    const lines = file.split(/[\r\n]+/);
    return lines.filter((line) => !line.startsWith('#'));
}

export async function joinGame(user_id:string, game_id:string) {
    try {
        const res = await sql`
            INSERT INTO game_users (game_id, user_id) VALUES (${game_id}, ${user_id}) ON CONFLICT DO NOTHING RETURNING game_id, user_id`
        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function startNewGameFromOld(old_game_id:string) {
    try {
        const wordList = await readWordList();
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        const res = await sql`
            INSERT INTO games (original_word) VALUES (${randomWord}) RETURNING id`;
        const newGame = res.rows[0];
        await sql`
            INSERT INTO game_users (game_id, user_id) select ${newGame.id} as game_id, user_id from game_users where game_id=${old_game_id}`
        await sql`INSERT INTO game_drawings (game_id, target_word, drawing_done)
VALUES (${newGame.id}, ${randomWord}, false)`
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function startNewGameFromUser(user_id:string) {
    try {
        const wordList = await readWordList();
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        const res = await sql`
            INSERT INTO games (original_word) VALUES (${randomWord}) RETURNING id`;
        const newGame = res.rows[0];
        await sql`
            INSERT INTO game_users (game_id, user_id) VALUES (${newGame.id}, ${user_id})`
        await sql`INSERT INTO game_drawings (game_id, target_word, drawing_done)
VALUES (${newGame.id}, ${randomWord}, false)`
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function fetchAvailableDrawings(user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.*, guesser.name as guesser_name, drawer.name as drawer_name FROM game_drawings 
                    JOIN game_users on game_users.game_id = game_drawings.game_id
                    JOIN users on users.id = game_users.user_id
                    LEFT JOIN users guesser on guesser.id = game_drawings.guesser_id
                    LEFT JOIN users drawer on drawer.id = game_drawings.drawer_id
            WHERE game_users.user_id = ${user_id}`;
        // const drawings:GameDrawing[] = [];
        // const drawingsByPrevId = data.rows.reduce((prev:{[key:string]:GameDrawing}, cur:GameDrawing) => ({...prev, [cur.prev_game_drawing_id]: cur}), {})
        // for (const drawing of data.rows) {
        //     if (drawing.prev_game_drawing_id == null) {
        //         drawings.push(drawing);
        //         break;
        //     }
        // }
        // let drawingId = drawings.at(0)?.id;
        // while (drawingId) {
        //     if (drawingId in drawingsByPrevId) {
        //         drawings.push(drawingsByPrevId[drawingId])
        //         drawingId = drawingsByPrevId[drawingId].id;
        //     } else {
        //         break;
        //     }
        // }
        return await Promise.all(data.rows.map(async (drawing) => (
            {...drawing,
                signed_url: await getSignedUrl(drawing.id)
        })));
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}