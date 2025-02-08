import {QueryResult, sql} from '@vercel/postgres';
import { v4 } from "uuid";
import {
    Game,
    GameDrawing, User,
} from './data_definitions';
import { promises as fs } from 'fs';
import {getSignedUrl} from "@/lib/gcs";
import client from "@/lib/redis";
import { format, toZonedTime } from 'date-fns-tz';

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
        // TODO: shouldn't need to do updates here anymore
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
        WHERE game_drawings.id = ${game_drawing_id} AND game_drawings.drawing_done=false
        RETURNING *`;
        const drawing = data.rows.length > 0 ? data.rows[0] : null;
        if (drawing === null) {
            throw new Error('Drawing already set or invalid id');
        }
        const nextPlayer = await nextPlayerByGame(drawing.game_id);
        if (nextPlayer === null) {
            // no more players
            return null;
        }
        await sql<GameDrawing>`
        INSERT INTO game_drawings (id, game_id, prev_game_drawing_id, drawing_done, guesser_id)
        VALUES (${v4()}, ${drawing.game_id}, ${drawing.id}, false, ${nextPlayer.id}) RETURNING *`
        await client.del('game_drawings_' + drawing.game_id + dateAtPST());
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update game_drawings record.');
    }
}

export async function nextPlayerByGame(game_id:string) {
    try {
        const data = await sql`SELECT users.*, game_users.play_order as play_order from game_users join users on users.id = game_users.user_id
    WHERE game_id = ${game_id}`;

        const pastData = await sql<GameDrawing>`SELECT * from game_drawings WHERE game_id = ${game_id}`;

        const pastGamers = pastData.rows.reduce((prev, cur) => {
            prev.add(cur.guesser_id);
            prev.add(cur.drawer_id);
            return prev;
        }, new Set());

        const haventPlayed = data.rows.filter((gu) => !pastGamers.has(gu.id));
        haventPlayed.sort((a,b) => a.play_order-b.play_order);
        return haventPlayed.length > 0 ? haventPlayed[0] : null;
    } catch(error) {
        console.error('Database Error:', error);
        throw new Error('Database Error');
    }
}

export async function nextPlayer(game_drawing_id:string) {
    try {
        const data = await sql`SELECT * from game_users 
    JOIN game_drawings ON game_drawings.game_id=game_users.game_id
    WHERE game_drawings.id = ${game_drawing_id}`;

        const pastData = await sql<GameDrawing>`SELECT g.* from game_drawings g JOIN game_drawings og ON g.game_id=og.game_id
WHERE og.id=${game_drawing_id}`;

        const pastGamers = pastData.rows.reduce((prev, cur) => {
            prev.add(cur.guesser_id);
            prev.add(cur.drawer_id);
            return prev;
        }, new Set());

        const haventPlayed = data.rows.filter((gu) => !pastGamers.has(gu.user_id))
        const playOrder = haventPlayed.sort((gu) => gu.play_order);
        return playOrder.length > 0 ? playOrder[0].user_id : null;
    } catch(error) {
        console.error('Database Error:', error);
        throw new Error('Database Error');
    }
}

export async function setGuess(game_drawing_id:string, guess: string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT * FROM game_drawings
            WHERE game_drawings.id = ${game_drawing_id}`;
        const gameDrawing = data.rows.length > 0 ? data.rows[0] : null;
        if (gameDrawing === null) {
            throw new Error(`Game drawing not found: ${game_drawing_id}`);
        }
        if (gameDrawing.target_word !== null) {
            throw new Error(`Guess already set`);
        }

        const nextPlayer = await nextPlayerByGame(gameDrawing.game_id);
        const nextPlayerId = nextPlayer? nextPlayer.id : null;
        await sql<GameDrawing>`
        UPDATE game_drawings SET target_word=${guess},
                             drawer_id=${nextPlayerId}
        WHERE game_drawings.id = ${game_drawing_id}`;
        await client.del('game_drawings_' + gameDrawing.game_id + dateAtPST());

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

export async function fetchGames(user_id:string, room_id:string) {
    try {
        const cachedGames = await client.get('room_games_' + room_id + dateAtPST());
        if (cachedGames !== null) {
            console.log('cache hit for games in room: ' + room_id)
            return JSON.parse(cachedGames);
        }
        const data = await sql`
            SELECT g.game_id, users.name FROM game_users g
                JOIN users original_user on g.user_id = original_user.id
                JOIN games on games.id = g.game_id
                    LEFT JOIN game_users g2 on (g2.game_id = g.game_id AND g2.user_id != g.user_id)
					LEFT JOIN users on users.id = g2.user_id
            WHERE g.user_id = ${user_id}
            and games.room_id = ${room_id}
            and games.play_date = (current_timestamp at time zone 'PST')::date`;

        const result = data.rows.reduce(
            (prev, cur) => {
                if (cur.game_id in prev) {
                    return {...prev, [cur.game_id]: [...prev[cur.game_id], {'name': cur.name}]};
                } else {
                    return {...prev, [cur.game_id]: cur.name? [{'name': cur.name}] : []}
                }
            }, {}
        )
        await client.set('room_games_' + room_id + dateAtPST(), JSON.stringify(result));
        return result;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function getRoom(user_id:string) {
    try {
        const data = await sql`
            SELECT u.room_id from users u where id=${user_id}`;

        if (data.rows.length === 0) {
            throw new Error('No user found.')
        }

        let room_id = data.rows[0].room_id;
        if (room_id === null) {
            // create new room with just one user
            room_id = v4();
            await sql`INSERT INTO rooms (id) VALUES (${room_id})`;
            await sql`UPDATE users SET room_id=${room_id} WHERE id=${user_id}`;
        }
        const usersData = await sql<User>`SELECT * from USERS where room_id=${room_id}`;
        const users = usersData.rows;


        return {
            'room_id': room_id,
            'users': users
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function readWordList() {
    const fileName = "/src/data/word_list.txt"
    const file = await fs.readFile(process.cwd() + fileName, 'utf8');
    const lines = file.split(/[\r\n]+/);
    return lines.reduce((prev:{[date: string]: string[]}, cur) => {
        const dateEndIndex = cur.indexOf(',');
        const dateStr = cur.slice(0, dateEndIndex);
        const words = cur.slice(dateEndIndex + 1, cur.length).replaceAll("\"", "").split(',');
        return {...prev, [dateStr]: words}
    }, {});
}

export async function getRoomies(room_id:string) {
    try {
        const cachedUsers = await client.get('roomies_' + room_id);
        if (cachedUsers !== null) {
            console.log('cache hit for room: '+ room_id);
            return JSON.parse(cachedUsers);
        }
        const users = await sql`SELECT * FROM users WHERE room_id=${room_id}`;
        await client.set('roomies_' + room_id, JSON.stringify(users.rows));
        return users.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function joinRoom(user_id:string, room_id:string) {
    try {
        const res = await sql`UPDATE users SET room_id = ${room_id} where id=${user_id} RETURNING *`;
        await client.del('roomies_' + room_id);
        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function leaveRoom(user_id:string, room_id:string) {
    try {
        const res = await sql`UPDATE users SET room_id = null where id=${user_id} RETURNING *`;
        const user = res.rows.length > 0 ? res.rows[0] : null;
        await client.del('roomies_' + room_id);
        return user;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

function dateAtPST(dateFormat: string = 'yyyy-MM-dd') {
    const now = new Date();
    const timeZone = 'America/Los_Angeles';
    const zonedDate = toZonedTime(now, timeZone);
    return format(zonedDate, dateFormat, { timeZone: timeZone });
}

export async function startNewGameForRoom(room_id:string) {
    try {
        const gamesData = await sql<Game>`SELECT * from games where room_id=${room_id}
                                                            AND play_date=(current_timestamp at time zone 'PST')::date`;
        if (gamesData.rows.length > 0) {
            throw new Error('Game already played today');
        }
        const data = await sql`SELECT *, TO_CHAR((current_timestamp at time zone 'PST')::date, 'YYYY-MM-DD') as today from users where room_id=${room_id}`;
        if (data.rows.length === 1) {
            throw new Error('Empty room')
        }
        if (data.rows.length > 5) {
            throw new Error('Game has too many users');
        }

        const users = data.rows.map((user) => user.id);

        const wordList = await readWordList();
        const todayDateString = data.rows[0].today;
        const todaysWords = wordList[todayDateString]
        // Shuffle array
        const shuffled = todaysWords.sort(() => 0.5 - Math.random());

        let i = 0;
        while (i < users.length) {
            const word = shuffled[i];
            const gameUsers = users.slice(i, users.length).concat(users.slice(0, i));
            const newGameData = await sql`INSERT INTO games (original_word, play_date, room_id) VALUES (${word}, ${todayDateString}, ${room_id}) RETURNING *`
            if (newGameData.rows.length === 0) {
                throw new Error('Failed creating game');
            }
            const newGameId = newGameData.rows[0].id;
            await Promise.all(
                        gameUsers.map(async (user, idx) => {
                            return sql`
                INSERT INTO game_users (user_id, game_id, play_order)
                VALUES (${user}, ${newGameId}, ${idx});
              `;
                }),
            );
            await sql`INSERT INTO game_drawings (game_id, target_word, drawing_done, drawer_id)
                        VALUES (${newGameId}, ${word}, false, ${users[i]})`
            i++;
            await client.del('room_games_' + room_id + dateAtPST());
        }

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function fetchAvailableDrawings(gameIds:string[]) {
    try {
        if (gameIds.length === 0) {
            return {drawings: {}, nextPlayers: {}};
        }

        const values = await Promise.all(gameIds.map(async (gameId) =>

            ({game_id: gameId, data: await client.get('game_drawings_' + gameId + dateAtPST())})));

        const cachedDrawings = await Promise.all(values.
        filter((v) => v['data'] !== null).
        map((v) => ({...v, data: JSON.parse(v['data'] as string)})).
        map(
            // update signed urls
            async (v) => (
            {   ...v,
                ...v['data'],
                game_drawings: await Promise.all(v['data']['game_drawings'].map(
                    async (d:GameDrawing) => ({...d, signed_url: await getSignedUrl(d.id)})))})));

        const cachedDrawingsByGameId = cachedDrawings.reduce((prev, v) => (v['data'] ? {
            ...prev, [v.game_id]: v.game_drawings
        } : prev), {});
        const cachedNextPlayersByGameId = cachedDrawings.reduce((prev, v) => (v['data'] ? {
            ...prev, [v.game_id]: v.next_players
        } : prev), {});

        for (const drawings of cachedDrawings) {
            console.log('cache hit for game: ', drawings['game_id']);
        }

        const uncachedGameIds = gameIds.filter((gameId) => !Object.keys(cachedDrawingsByGameId).includes(gameId));
        if (uncachedGameIds.length === 0) {
            return {drawings: cachedDrawingsByGameId, nextPlayers: cachedNextPlayersByGameId};
        }

        const data:QueryResult<GameDrawing>[] = await Promise.all(uncachedGameIds.map(async (gameId) => await sql<GameDrawing>`
            SELECT game_drawings.*, guesser.name as guesser_name, drawer.name as drawer_name FROM game_drawings 
                    LEFT JOIN users guesser on guesser.id = game_drawings.guesser_id
                    LEFT JOIN users drawer on drawer.id = game_drawings.drawer_id
            WHERE game_drawings.game_id = ${gameId}`));

        let drawings:GameDrawing[] = [];
        for (const queryRes of data) {
            const thisGameDrawings:GameDrawing[] = [];
            const drawingsByPrevId = queryRes.rows.reduce((prev: {[prev_id: string]: GameDrawing}, cur) => {
                return {...prev, [cur.prev_game_drawing_id]: cur}
            }, {})
            const firstDrawing = queryRes.rows.find(d => d.prev_game_drawing_id === null);
            let curDrawing = firstDrawing;
            while (curDrawing) {
                thisGameDrawings.push(curDrawing);
                if (curDrawing.id in drawingsByPrevId) {
                    curDrawing = drawingsByPrevId[curDrawing.id];
                }
                else {
                    break;
                }
            }
            drawings = drawings.concat(thisGameDrawings.reverse());
        }

        const updatedDrawings = await Promise.all(drawings.map(async (drawing) => (
            {...drawing,
                signed_url: await getSignedUrl(drawing.id)
        })));

        const gameDrawings = updatedDrawings.reduce((prev: {[key: string]: GameDrawing[]}, cur) => {
            if (cur.game_id in prev) {
                return {...prev, [cur.game_id]: [...prev[cur.game_id], cur]};
            } else {
                return {...prev, [cur.game_id]: [cur]}
            }
        }, {});

        const nextPlayers = await Promise.all(uncachedGameIds.map(async (gameId) =>
            ({gameId, nextPlayer: await nextPlayerByGame(gameId)})));

        const nextPlayersByGame:{[game_id: string]: User} = nextPlayers.reduce((prev, cur) =>
            ({...prev, [cur.gameId]: cur.nextPlayer}), {});

        for (const gameId of uncachedGameIds) {
            await client.set('game_drawings_' + gameId + dateAtPST(), JSON.stringify({
                next_players: nextPlayersByGame[gameId],
                game_drawings: gameDrawings[gameId]
            }));
        }
        return {drawings: {
            ...cachedDrawingsByGameId,
            ...gameDrawings
            }, nextPlayers: {
                ...cachedNextPlayersByGameId,
                ...nextPlayersByGame
            }
            };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}