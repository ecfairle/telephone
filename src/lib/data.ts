import {sql} from '@vercel/postgres';
import { v4 } from "uuid";
import {
    Game,
    GameDrawing, GameShuff, User,
} from './data_definitions';
import { promises as fs } from 'fs';
import {getSignedUrl} from "@/lib/gcs";
import redis from "@/lib/redis";
import { format, toZonedTime } from 'date-fns-tz';
import qstash from "@/lib/qstash";

const MAX_SHUFFLE_GAME_LENGTH = 8;
const SHUFFLE_GAME_EXPIRY_MIN = 30;

export async function reserveGameDrawing(game_drawing_id:string, user_id:string) {
    try {
        const data = await sql<GameDrawing>`
            SELECT game_drawings.*, games.room_id FROM game_drawings
            LEFT JOIN games on games.id = game_drawings.game_id
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
            SELECT game_drawings.*, games.room_id FROM game_drawings
            LEFT JOIN games on games.id = game_drawings.game_id
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

export async function updateShuffleGame(game_drawing_id:string) {
    await sql<GameShuff>`
    UPDATE shuffle_games set draw_turn=false, available=true from game_drawings where game_drawings.id=${game_drawing_id} AND game_drawings.game_id=shuffle_games.id RETURNING shuffle_games.*`;
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
        await updateShuffleGame(game_drawing_id);
        await redis.del(`game_drawings_expiry_${drawing.game_id}`);
        await redis.del(`shuffle_games_${drawing.drawer_id}`);
        if (nextPlayer === null) {
            // no more players
            await redis.del('game_drawings_' + drawing.game_id + dateAtPST());
            return null;
        }
        await sql<GameDrawing>`
        INSERT INTO game_drawings (id, game_id, prev_game_drawing_id, drawing_done, guesser_id)
        VALUES (${v4()}, ${drawing.game_id}, ${drawing.id}, false, ${nextPlayer.id}) RETURNING *`
        await redis.del('game_drawings_' + drawing.game_id + dateAtPST());
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
        const data = await sql<GameDrawing & {guesser_count:string, drawer_count:string}>`
            SELECT game_drawings.*, count(distinct(gdg.drawer_id)) as drawer_count, count(distinct(gdg.guesser_id)) as guesser_count FROM game_drawings
            LEFT JOIN game_drawings gdg on gdg.game_id=game_drawings.game_id
            WHERE game_drawings.id = ${game_drawing_id} group by game_drawings.id`;
        const gameDrawing = data.rows.length > 0 ? data.rows[0] : null;
        if (gameDrawing === null) {
            throw new Error(`Game drawing not found: ${game_drawing_id}`);
        }
        if (gameDrawing.target_word !== null) {
            throw new Error(`Guess already set`);
        }

        const nextPlayer = await nextPlayerByGame(gameDrawing.game_id);
        const totalPlayers = parseInt(gameDrawing.drawer_count) + parseInt(gameDrawing.guesser_count);
        const isAvailable = totalPlayers < MAX_SHUFFLE_GAME_LENGTH;
        console.log('\n\n\nisAvailable: ', isAvailable, gameDrawing.drawer_count, gameDrawing.guesser_count);
        await sql`UPDATE shuffle_games
                  set draw_turn= true,
                      available= ${isAvailable}
                      WHERE shuffle_games.id=${gameDrawing.game_id}
                      RETURNING shuffle_games.*`;

        const nextPlayerId = nextPlayer? nextPlayer.id : null;
        await sql<GameDrawing>`
        UPDATE game_drawings SET target_word=${guess},
                             drawer_id=${nextPlayerId}
        WHERE game_drawings.id = ${game_drawing_id}`;
        await redis.del('game_drawings_' + gameDrawing.game_id + dateAtPST());
        await redis.del(`game_drawings_expiry_${gameDrawing.game_id}`);
        await redis.del(`shuffle_games_${gameDrawing.guesser_id}`);
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
        const cachedGames = await redis.get('room_games_' + room_id + dateAtPST());
        if (cachedGames !== null) {
            return JSON.parse(cachedGames);
        }
        console.log('cache miss for games in room: ' + room_id);
        const data = await sql`
            SELECT g.game_id, users.name, 
                   TO_CHAR(play_date, 'YYYY-MM-DD')
            FROM game_users g
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
        const dateStr = data.rows.length > 0? data.rows[0].play_date : dateAtPST();
        await redis.set('room_games_' + room_id + dateStr, JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function createRoom(user_id:string) {
    try {
        const room_id = v4();
        const data = await sql`INSERT INTO rooms (id) VALUES (${room_id}) returning *`;
        await sql`INSERT INTO user_rooms (user_id, room_id) VALUES (${user_id}, ${room_id})`;
        return data.rows.length > 0 ? data.rows[0] : null;
    } catch(error) {
        console.error('Database Error:', error);
        throw new Error('Failed to create room.');
    }
}

export async function getRooms(user_id: string) {
    try {
        const data = await sql`
            SELECT room_id from user_rooms join rooms on rooms.id=user_rooms.room_id
            where user_rooms.user_id=${user_id} ORDER BY rooms.created_at`;

        const roomIds = data.rows.map(row => row.room_id);
        const roomData = Promise.all(roomIds.map(async roomId => {
            const usersData = await sql<User>`SELECT * from USERS JOIN user_rooms on user_rooms.room_id = ${roomId} AND users.id=user_rooms.user_id`;
            return {
                'room_id': roomId,
                'users': usersData.rows
            }
        }));

        return roomData;
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
        const cachedUsers = await redis.get('roomies_' + room_id);
        if (cachedUsers !== null) {
            return JSON.parse(cachedUsers);
        }
        console.log('cache miss for room: '+ room_id);
        const users = await sql`
SELECT users.* FROM users JOIN user_rooms on user_rooms.room_id=${room_id} and user_rooms.user_id=users.id`;
        await redis.set('roomies_' + room_id, JSON.stringify(users.rows));
        return users.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function joinRoom(user_id:string, room_id:string) {
    try {
        const res = await sql`UPDATE users SET room_id = ${room_id} where id=${user_id} RETURNING *`;
        await sql`INSERT INTO user_rooms (user_id,room_id) VALUES (${user_id},${room_id})`
        await redis.del('roomies_' + room_id);
        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function leaveRoom(user_id:string, room_id:string) {
    try {
        const res = await sql`UPDATE users SET room_id = null where id=${user_id} RETURNING *`;
        await sql`DELETE from user_rooms where user_id=${user_id} and room_id=${room_id}`;
        const user = res.rows.length > 0 ? res.rows[0] : null;
        await redis.del('roomies_' + room_id);
        return user;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export function dateTimeAtPST() {
    const now = new Date();
    const timeZone = 'America/Los_Angeles';
    const zonedDate = toZonedTime(now, timeZone);
    return zonedDate;
}
export function dateAtPST(dateFormat: string = 'yyyy-MM-dd') {
    const pstDateTime = dateTimeAtPST();
    const timeZone = 'America/Los_Angeles';
    return format(pstDateTime, dateFormat, { timeZone: timeZone });
}

export async function startNewGameForRoom(room_id:string) {
    try {
        const gamesData = await sql<Game>`SELECT * from games where room_id=${room_id}
                                                            AND play_date=(current_timestamp at time zone 'PST')::date`;
        if (gamesData.rows.length > 0) {
            throw new Error('Game already played today');
        }
        const data = await sql`SELECT *, TO_CHAR((current_timestamp at time zone 'PST')::date, 'YYYY-MM-DD') as today 
            from users join user_rooms on user_rooms.room_id=${room_id} and user_rooms.user_id=users.id`;
        if (data.rows.length === 1) {
            throw new Error('Empty room')
        }
        if (data.rows.length > 5) {
            throw new Error('Game has too many users');
        }

        const users = data.rows.map((user) => user.id);
        const todayDateString = data.rows[0].today;

        const wordRows = await sql`SELECT * FROM words WHERE id not in (select word_id from used_words
                                                    where room_id=${room_id}) ORDER BY RANDOM() limit ${users.length}`;

        if (wordRows.rows.length < users.length) {
            throw new Error('Out of words!');
        }


        let i = 0;
        while (i < users.length) {
            const word = wordRows.rows[i].word;
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
            await sql`INSERT INTO used_words (room_id, word_id) VALUES (${room_id}, ${wordRows.rows[i].id})`
            await redis.del('room_games_' + room_id + dateAtPST());
            i++;
        }

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch games data.');
    }
}

export async function createFreshShufflePrompts(user_id:string, numGames:number=1) {
    try {

        const wordRows = await sql`SELECT * FROM words ORDER BY RANDOM() limit ${numGames}`;

        let i = 0;
        const gameIds = [];
        while (i < numGames) {
            const word = wordRows.rows[i].word;
            const sGameId = v4();
            gameIds.push(sGameId);
            await sql`INSERT INTO shuffle_games (id, orig_game_id, original_word) VALUES (${sGameId}, ${sGameId}, ${word}) RETURNING *`
            await sql`INSERT INTO game_drawings (game_id, target_word, drawing_done, drawer_id)
                        VALUES (${sGameId}, ${word}, false, ${user_id})`
            await sql`INSERT INTO shuffle_game_users (orig_game_id, user_id) VALUES (${sGameId}, ${user_id})`
            await redis.set('game_drawings_expiry_' + sGameId,
                (new Date(dateTimeAtPST().getTime() + SHUFFLE_GAME_EXPIRY_MIN*60000)).getTime());
            await redis.sAdd('shuffle_games_reserved', sGameId);
            i++;
        }
        return gameIds;
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

            ({game_id: gameId, data: await redis.get('game_drawings_' + gameId + dateAtPST())})));

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

        const uncachedGameIds = gameIds.filter((gameId) => !Object.keys(cachedDrawingsByGameId).includes(gameId));
        if (uncachedGameIds.length === 0) {
            return {drawings: cachedDrawingsByGameId, nextPlayers: cachedNextPlayersByGameId};
        }

        for (const gameId of uncachedGameIds) {
            console.log('cache miss for game: ', gameId);
        }

        const data = await Promise.all(uncachedGameIds.map(async (gameId) =>
            await sql<GameDrawing & {is_shuffle_game: boolean}>`
            SELECT game_drawings.*, guesser.name as guesser_name, drawer.name as drawer_name, (shuffle_games.id is not null) as is_shuffle_game
                   FROM game_drawings 
                    LEFT JOIN users guesser on guesser.id = game_drawings.guesser_id
                    LEFT JOIN users drawer on drawer.id = game_drawings.drawer_id
                    LEFT JOIN shuffle_games on shuffle_games.id=${gameId}
            WHERE game_drawings.game_id = ${gameId}`));

        let drawings:GameDrawing[] = [];
        for (const queryRes of data) {
            const thisGameDrawings:GameDrawing[] = [];
            const drawingsByPrevId = queryRes.rows.reduce(
                (prev: {[prev_id: string]: GameDrawing & {is_shuffle_game: boolean}}, cur) => {
                return {...prev, [cur.prev_game_drawing_id]: cur}
            }, {})
            const firstDrawing = queryRes.rows.find(d => d.prev_game_drawing_id === null);
            let curDrawing = firstDrawing;
            let idx = 1;
            while (curDrawing) {
                if (curDrawing.is_shuffle_game) {
                    thisGameDrawings.push({
                        ...curDrawing,
                        guesser_name: curDrawing.guesser_id !== null ? `Player ${idx++}` : '',
                        drawer_name: curDrawing.drawer_id !== null ? `Player ${idx++}` : ''
                    })
                }
                else thisGameDrawings.push(curDrawing);

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
            await redis.set('game_drawings_' + gameId + dateAtPST(), JSON.stringify({
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
export async function getAllShuffleGamesDB() {
    const data = await sql<GameShuff>`select *, ((updated_at + INTERVAL '30 seconds') < (current_timestamp)) as reserve_expired  from shuffle_games`;
    return data.rows;
}
export async function getAllShuffleGames() {
    return await redis.sMembers('shuffle_games_reserved');
}

export async function unreserveDrawing(gameId:string) {
    try {
        const lastRecord = await getLastGameRecord(gameId);
        // check state is accurate
        if (lastRecord.drawing_done) {
            console.log('Couldn\'t unreserve: Drawing already finished');
            return;
        }
        if (lastRecord.prev_game_drawing_id === null) {
            // this was the first turn
            await sql`delete from game_drawings where id=${lastRecord.id}`
            await sql`delete from shuffle_games where id=${gameId}`
        } else {
            await sql`update game_drawings set drawer_id=null where id=${lastRecord.id}`;
            await sql`update shuffle_games set available=true where id=${lastRecord.game_id}`
        }
        await sql`delete from shuffle_game_users where orig_game_id = ${gameId} and user_id=${lastRecord.drawer_id}`;
        await redis.del(`shuffle_games_${lastRecord.drawer_id}`);
    } catch (error) {
        console.log(error);
        throw new Error('Failed to unreserve drawing');
    }
}

export async function unreserveGuess(gameId:string) {
    try {
        const lastRecord = await getLastGameRecord(gameId);
        // check state is accurate
        if (lastRecord.target_word !== null) {
            console.log('Couldn\'t unreserve: Guess already finished');
            return;
        }
        await sql`delete from game_drawings where id=${lastRecord.id}`;
        await sql`update shuffle_games set available=true where id=${lastRecord.game_id}`
        await sql`delete from shuffle_game_users where orig_game_id = ${gameId} and user_id=${lastRecord.guesser_id}`;
        await redis.del(`shuffle_games_${lastRecord.guesser_id}`);
    } catch (error) {
        console.log(error);
        throw new Error('Failed to unreserve drawing');
    }
}

export async function checkExpiredShuffleDrawings(gameIds?:string[]) {
    try {
        const shuffleGames = gameIds? gameIds : await getAllShuffleGames();
        const expiredGameIds = [];
        for (const shuffleGameId of shuffleGames) {
            const expiryTime = await redis.get('game_drawings_expiry_' + shuffleGameId);
            if (!expiryTime) {
                // all active shuffle turns should have an entry
                expiredGameIds.push(shuffleGameId);
                continue;
            }
            if (dateTimeAtPST().getTime() > parseInt(expiryTime)) {
                console.log(`Sending game ${shuffleGameId} to be unreserved`);
                await qstash.publishJSON({
                    url: `${process.env.NEXT_PUBLIC_SITE_URL}/game_expiry`,
                    body: {shuffleGameId},
                });
                await redis.del('game_drawings_expiry_' + shuffleGameId);
                expiredGameIds.push(shuffleGameId);
            }
        }
        return expiredGameIds;
    } catch (error) {
        console.log(error);
        throw new Error('Failed to checked reserved drawings expiry');
    }
}

export async function unreserveShuffle(shuffleGameId:string) {
    const data = await sql<GameShuff>`select * from shuffle_games where id=${shuffleGameId}`;
    const game = data.rows[0];
    if (!game) {
        return;
    }
    console.log(`Expiring ${shuffleGameId} - ${game.draw_turn ? 'draw turn':'guess turn'}`);
    if (game.draw_turn) {
        await unreserveDrawing(shuffleGameId);
    } else {
        await unreserveGuess(shuffleGameId);
    }
    await redis.sRem('shuffle_games_reserved', shuffleGameId);
    await redis.del('game_drawings_' + shuffleGameId + dateAtPST());
}

const getLastGameRecord = async (gameId:string) =>  {
    const gameDrawingsData = await sql<GameDrawing>`
                SELECT * from game_drawings where game_id=${gameId}`;
    const drawingsByPrevId = gameDrawingsData.rows.reduce(
        (prev: {[prev_id: string]: GameDrawing}, cur) => {
            return cur.prev_game_drawing_id!==null? {...prev, [cur.prev_game_drawing_id]: cur} : prev
        }, {});
    const firstDrawing = gameDrawingsData.rows.find(d => d.prev_game_drawing_id === null);
    const drawingsInOrder:GameDrawing[] = [];
    let curDrawing = firstDrawing;
    while (curDrawing) {
        drawingsInOrder.push(curDrawing);
        if (curDrawing.id in drawingsByPrevId) {
            curDrawing = drawingsByPrevId[curDrawing.id];
        }
        else {
            break;
        }
    }
    const lastDrawing = drawingsInOrder[drawingsInOrder.length - 1];
    return lastDrawing;
}

const TOTAL_DRAWS_SHUFFLE = 1;
const TOTAL_GUESS_SHUFFLE = 1;
export async function pullShuffle(user_id:string) {
    try {
        const availableDrawTurnsFresh = await sql<GameShuff>`
            SELECT orig_game_id from shuffle_games where orig_game_id not in (
                select orig_game_id from shuffle_game_users where user_id=${user_id}
            ) AND draw_turn=true AND available=true AND updated_at > current_timestamp - INTERVAL '1 DAY'
            GROUP BY orig_game_id ORDER BY MIN(created_at) LIMIT ${TOTAL_DRAWS_SHUFFLE}`;

        const drawTurns = availableDrawTurnsFresh.rows;
        if (drawTurns.length < TOTAL_DRAWS_SHUFFLE) {
            const oldDrawsCount = TOTAL_DRAWS_SHUFFLE - drawTurns.length;
            const availableDrawTurnsOld = await sql<GameShuff>`
                SELECT orig_game_id from shuffle_games where orig_game_id not in (
                    select orig_game_id from shuffle_game_users where user_id=${user_id}
                ) AND draw_turn=true AND available=true AND updated_at <= current_timestamp - INTERVAL '1 DAY'
                GROUP BY orig_game_id ORDER BY MIN(created_at) LIMIT ${oldDrawsCount}`;
            drawTurns.push(...availableDrawTurnsOld.rows);
        }
        const drawGameIds = drawTurns.map(row=>row.orig_game_id);
        console.log(`pull for user ${user_id}`)
        if (drawGameIds.length < TOTAL_DRAWS_SHUFFLE) {
            const newGameIds = await createFreshShufflePrompts(user_id, 1);
            drawGameIds.push(...newGameIds);
            console.log(`fresh prompt: `, drawGameIds);
        }

        const availableShuffleDrawGames = await Promise.all(drawTurns.map(async (gs) =>
            {
                const firstGame = await sql<GameShuff>`
                SELECT * from shuffle_games where orig_game_id=${gs.orig_game_id} AND available=true ORDER BY created_at LIMIT 1`;
                return firstGame.rows[0];
            }
        ));

        const lastEntriesDrawTurn = await Promise.all(
            availableShuffleDrawGames.map(game => game.id).map(getLastGameRecord));
        for (const drawing of lastEntriesDrawTurn) {
            // check if game hasn't been assigned yet
            if (!drawing.target_word || drawing.drawer_id !== null) continue;

            await sql<GameDrawing>`
                UPDATE game_drawings SET drawer_id=${user_id} where id=${drawing.id} RETURNING *`
            await sql`INSERT INTO shuffle_game_users (orig_game_id, user_id) VALUES (${drawing.game_id}, ${user_id})`
            await sql`UPDATE shuffle_games SET available=false where id=${drawing.game_id}`
            await redis.set('game_drawings_expiry_' + drawing.game_id,
                (new Date(dateTimeAtPST().getTime() + SHUFFLE_GAME_EXPIRY_MIN*60000)).getTime());
            await redis.sAdd('shuffle_games_reserved', drawing.game_id);
            await redis.del('game_drawings_' + drawing.game_id + dateAtPST());
            console.log(`draw turn: `, drawing.id);
        }


        const availableGuessTurnsFresh = await sql<GameShuff>`
            SELECT orig_game_id from shuffle_games where orig_game_id not in (
                select orig_game_id from shuffle_game_users where user_id=${user_id}
            ) AND draw_turn=false AND available=true AND updated_at > current_timestamp - INTERVAL '1 DAY'
            GROUP BY orig_game_id ORDER BY MIN(created_at) LIMIT ${TOTAL_GUESS_SHUFFLE}`;

        const guessTurns = availableGuessTurnsFresh.rows;
        if (guessTurns.length < TOTAL_GUESS_SHUFFLE) {
            const availableGuessTurnsOld = await sql<GameShuff>`
                SELECT orig_game_id from shuffle_games where orig_game_id not in (
                    select orig_game_id from shuffle_game_users where user_id=${user_id}
                    ) AND draw_turn=false AND available=true AND updated_at <= current_timestamp - INTERVAL '1 DAY'
                GROUP BY orig_game_id ORDER BY MIN(created_at) LIMIT ${TOTAL_GUESS_SHUFFLE}`;
            guessTurns.push(...availableGuessTurnsOld.rows);
        }

        const guessGameIds = guessTurns.map(row=>row.orig_game_id);

        const availableShuffleGuessGames = await Promise.all(guessTurns.map(async (gs) =>
        {
            const firstGame = await sql<GameShuff>`
                SELECT * from shuffle_games where orig_game_id=${gs.orig_game_id} AND available=true ORDER BY created_at LIMIT 1`;
            return firstGame.rows[0];
        }
        ));
        const lastEntries = await Promise.all(
            availableShuffleGuessGames.map(game => game.id).map(getLastGameRecord));
        for (const drawing of lastEntries) {
            // check if game hasn't been assigned yet
            if (!drawing.drawing_done) continue;

            await sql<GameDrawing>`
                INSERT INTO game_drawings (id, game_id, prev_game_drawing_id, drawing_done, guesser_id)
                VALUES (${v4()}, ${drawing.game_id}, ${drawing.id}, false, ${user_id}) RETURNING *`
            await sql`INSERT INTO shuffle_game_users (orig_game_id, user_id) VALUES (${drawing.game_id}, ${user_id})`
            await sql`UPDATE shuffle_games SET available=false where id=${drawing.game_id}`
            await redis.set('game_drawings_expiry_' + drawing.game_id,
                (new Date(dateTimeAtPST().getTime() + SHUFFLE_GAME_EXPIRY_MIN*60000)).getTime());
            await redis.sAdd('shuffle_games_reserved', drawing.game_id);
            await redis.del('game_drawings_' + drawing.game_id + dateAtPST());
            console.log(`guess turn: `, drawing.id);
        }
        await redis.del(`shuffle_games_${user_id}`);


        const shuffGameIds = await Promise.all([...drawGameIds, ...guessGameIds].map(
            async (origGameId) => {
                const data = await sql`SELECT *
                          from shuffle_games
                          where orig_game_id = ${origGameId}
                          ORDER BY created_at LIMIT 1`
                return data.rows[0].id;
            }
        ));

        return shuffGameIds;
    } catch (error) {
        console.log(error);
        throw new Error('Failed to create Shuffle game data.');
    }
}

export async function getShuffleGames(user_id:string) {
    try {
        const cachedGamesData = await redis.get(`shuffle_games_${user_id}`);

        if (cachedGamesData) {
            const parsedGamesData = JSON.parse(cachedGamesData);
            const activeGames = parsedGamesData.filter((game:{turnUser:string|null}) => game.turnUser === user_id);
            const expiredGameIds = await checkExpiredShuffleDrawings(activeGames.map((game:GameDrawing) => game.game_id));
            return parsedGamesData.filter((game:GameDrawing) => !expiredGameIds.includes(game.game_id));
        }
        const data = await sql`SELECT * FROM shuffle_game_users WHERE user_id=${user_id} order by created_at desc`;
        const gameIds = data.rows.map(row => row.orig_game_id);
        const lastRecords = await Promise.all(gameIds.map(async gameId=> await getLastGameRecord(gameId)));
        const gamesData = lastRecords.filter(record => record !== undefined).map(record => ({
            ...record,
            drawTurn: record.drawer_id && !record.drawing_done,
            turnUser: (record.drawer_id && !record.drawing_done)? record.drawer_id: record.target_word === null ? record.guesser_id : null,
        }));
        const gamesDataWithSignedUrl = await Promise.all(gamesData.map(async game => ({
            ...game,
            signedUrl: await getSignedUrl(game.prev_game_drawing_id)
        })))
        await redis.set(`shuffle_games_${user_id}`, JSON.stringify(gamesDataWithSignedUrl));
        const activeGames = gamesDataWithSignedUrl.filter(game => game.turnUser === user_id);
        const expiredGameIds = await checkExpiredShuffleDrawings(activeGames.map(game => game.game_id));
        return gamesDataWithSignedUrl.filter(
            (game:GameDrawing) => !expiredGameIds.includes(game.game_id));
    } catch(error) {
        console.log(error);
        throw new Error('Failed to get shuffle games');
    }
}