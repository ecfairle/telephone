// pages/api/game-events/[userId].js
import {authOptions} from "@/app/api/auth/[...nextauth]/auth";
import { getServerSession } from 'next-auth';
import { fetchAvailableDrawings, getShuffleGames } from '@/lib/data';
import { getRoomies } from '@/lib/data';
import {createClient} from "redis";
import { User, GameDrawing } from "@/lib/data_definitions";

const subscriber = await createClient({url: process.env.REDIS2_REDIS_URL!})
    .on('error', err => console.log('Redis Client Error', err))
    .connect();
// Store active user connections
const userConnections = new Map<string, { games: Set<string>, roomId: string | null, lastActivity: number, controller: ReadableStreamDefaultController }>();

export async function GET(request: Request, { params }: { params: Promise<{ room_id: string }> }) {
    const session = await getServerSession(authOptions);
    const roomId = (await params).room_id;
  
  if (!session?.user?.userId) {
    return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const userId = session.user.userId;

  // Get user's games and room
  const userGames = await getShuffleGames(userId, null, roomId);
  const roomies:User[] = await getRoomies(roomId);

  // Channels to subscribe to initially
  const gameChannels = userGames.map((game: GameDrawing) => `game_events:${game.game_id}`);
  const gameData = await fetchAvailableDrawings(userGames.map((game:GameDrawing)=>game.game_id), false)
  console.log('gameData', gameData)
  const roomChannel = roomId ? [`room_events:${roomId}`] : [];
  const userChannel = `user_events:${userId}`;
  const allChannelsToSubscribe = [...gameChannels, ...roomChannel, userChannel];

  async function messageHandler  (message: string, channel: string, controller: ReadableStreamDefaultController) {
        const connection = userConnections.get(userId);
        if (!connection) return;

        try {
          console.log(`Received message on channel ${channel}:`, message);
          const data = JSON.parse(message);

          if (channel === userChannel && ['join_game', 'leave_game', 'join_room', 'leave_room', 'new_draw_turn_assigned', 'new_guess_turn_assigned'].includes(data.type)) {
            await handleChannelChange(data);
            return; // Don't process as a regular event
          } 

          // Filter messages - same logic as before
          const isGameMessage = channel.startsWith('game_events:');
          const isRoomMessage = channel.startsWith('room_events:');
          const isUserMessage = channel === userChannel;

          const gameId = isGameMessage ? channel.split(':')[1] : null;
          const messageRoomId = isRoomMessage ? channel.split(':')[1] : null;
          
          const isRelevantMessage = isUserMessage || (isGameMessage && gameId !== null && connection.games.has(gameId)) || (isRoomMessage && connection.roomId === messageRoomId);

          if (isRelevantMessage) {
            let gameData = null;
            let game = null;
            let games = null;
            let roomies = null;
            if (gameId !== null) {
              gameData =  await fetchAvailableDrawings([gameId]);
              game = (await getShuffleGames(userId, null, roomId)).filter(g => g.game_id === gameId)[0];
            }
            if (messageRoomId !== null) {
              roomies = await getRoomies(messageRoomId);
              if (data.type === 'start_game') {
                games = await getShuffleGames(userId, null, messageRoomId);
                gameData = await fetchAvailableDrawings(games.map(g => g.game_id), false);
                subscriber.subscribe(games.map((game: GameDrawing) => `game_events:${game.game_id}`), (message: string, channel: string) => messageHandler(message, channel, connection.controller));
                for (const game of games) {
                    connection.games.add(game.game_id);
                }
                console.log(userId, 'Subscribed to new game channels for room start_game', games.map((game: GameDrawing) => `game_events:${game.game_id}`))
              }
            }
            const eventData = {
              type: isGameMessage ? 'game_update' : (isRoomMessage ? data.type : 'user_update'),
              gameId: gameId,
              roomId: messageRoomId,
              channel: channel,
              data: data,
              gameData,
              games: games,
              game: game,
              roomies: roomies,
              userId: data.userId || null,
              user: data.user || null,
              timestamp: new Date().toISOString()
            };

            // Enqueue the SSE formatted data into the stream
            if (!controller.desiredSize === null) {
              // Controller is closed, don't try to write
              console.log('Controller closed, not sending message');
              return;
            }
            controller.enqueue(`data: ${JSON.stringify(eventData)}

`);
            connection.lastActivity = Date.now();
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
  // Create a ReadableStream for the SSE response
  const stream = new ReadableStream({
    start(controller) {
      // Store connection details, including the controller to enqueue messages
      userConnections.set(userId, {
        games: new Set(userGames.map((game: GameDrawing) => game.game_id)),
        roomId: roomId,
        lastActivity: Date.now(),
        controller: controller
      });

      console.log(`User ${userId} connected. Subscribing to:`, allChannelsToSubscribe);

      // Subscribe to Redis channels
      subscriber.subscribe(allChannelsToSubscribe, (message: string, channel: string) => messageHandler(message, channel, controller));

      // Send initial connection confirmation message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        userId: userId,
        games: userGames,
        roomies: roomies,
        gameData: gameData,
        roomId: roomId,
        message: 'Connected to events stream'
      })}

`);
    },

    cancel() {
      // Cleanup on stream cancellation (client disconnects)
      const connection = userConnections.get(userId);
      if (connection) {
        // Unsubscribe from all channels
        const allChannels = Array.from(connection.games).map(id => `game_events:${id}`);
        if (connection.roomId) {
            allChannels.push(`room_events:${connection.roomId}`);
        }
        allChannels.push(`user_events:${userId}`);

        if (allChannels.length > 0) {
          subscriber.unsubscribe(allChannels, (err, count) => {
               if (err) console.error('Error unsubscribing from channels:', err);
               else console.log(`Unsubscribed from ${count} channels for user ${userId}`);
           });
        }

        userConnections.delete(userId);
        console.log(`User ${userId} disconnected from events stream`);
      }
    },
  });

  // Handle dynamic game/room changes published on the user's channel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChannelChange = async (data: any) => {
    console.log('handleChannelChange', data);
    const connection = userConnections.get(userId);
    console.log('connections', userConnections)
    if (!connection || !connection.controller) return;
    console.log('controller')
    if (data.type === 'join_game') {
      const newGameId = data.gameId;
      if (newGameId && !connection.games.has(newGameId)) {
        console.log(`here: game_events:${newGameId}`)
        subscriber.subscribe(`game_events:${newGameId}`, (message: string, channel: string) => messageHandler(message, channel, connection.controller));
        connection.games.add(newGameId);
        const game = (await getShuffleGames(userId, newGameId))[0];
        connection.controller.enqueue(`data: ${JSON.stringify({
          type: 'game_joined',
          gameId: newGameId,
          gameData: game,
          message: 'Subscribed to new game events'
        })}

`);
      }
    } else if (data.type === 'leave_game') {
      const gameId = data.gameId;
      console.log('leave game', gameId, connection.games)
      if (gameId && connection.games.has(gameId)) {
        subscriber.unsubscribe(`game_events:${gameId}`, (err) => {
             if (err) console.error('Error unsubscribing from game channel:', err);
             else console.log(`User ${userId} unsubscribed from game_events:${gameId}`);
         });
        connection.games.delete(gameId);

        connection.controller.enqueue(`data: ${JSON.stringify({
          type: 'game_left',
          gameId: gameId,
          message: 'Unsubscribed from game events'
        })}`);
      }
    } else if (data.type === 'leave_game') {
      const gameId = data.gameId;
      console.log('leave game', gameId, connection.games)
      if (gameId && connection.games.has(gameId)) {
        subscriber.unsubscribe(`game_events:${gameId}`, (err) => {
             if (err) console.error('Error unsubscribing from game channel:', err);
             else console.log(`User ${userId} unsubscribed from game_events:${gameId}`);
         });
        connection.games.delete(gameId);

        connection.controller.enqueue(`data: ${JSON.stringify({
          type: 'game_left',
          gameId: gameId,
          message: 'Unsubscribed from game events'
        })}

`);
      }
    } else if (data.type === 'join_room') {
      const newRoomId = data.roomId;
      if (newRoomId && connection.roomId !== newRoomId) {
        subscriber.subscribe(`room_events:${newRoomId}`, () => {
            console.log(`User ${userId} subscribed to room_events:${newRoomId}`);
        });
        if (connection.roomId) {
            subscriber.unsubscribe(`room_events:${connection.roomId}`, (err) => {
                if (err) console.error('Error unsubscribing from old room channel:', err);
                else console.log(`User ${userId} unsubscribed from room_events:${connection.roomId}`);
            });
        }
        connection.roomId = newRoomId;

        connection.controller.enqueue(`data: ${JSON.stringify({
          type: 'room_joined',
          roomId: newRoomId,
          message: 'Subscribed to new room events'
        })}

`);
      }
    } else if (data.type === 'leave_room') {
        const roomId = data.roomId;
        if (roomId && connection.roomId === roomId) {
            subscriber.unsubscribe(`room_events:${roomId}`, (err) => {
                if (err) console.error('Error unsubscribing from room channel:', err);
                else console.log(`User ${userId} unsubscribed from room_events:${roomId}`);
            });
            connection.roomId = null;

            connection.controller.enqueue(`data: ${JSON.stringify({
              type: 'room_left',
              roomId: roomId,
              message: 'Unsubscribed from room events'
            })}

`);
        }
    }
    else if (data.type === 'new_draw_turn_assigned' || data.type === 'new_guess_turn_assigned') {
        console.log(`User ${userId} received new turn assignment:`, data);
        const drawTurn = data.type === 'new_draw_turn_assigned';
        connection.controller.enqueue(`data: ${JSON.stringify({ type: data.type, gameId: data.gameId, message: 'New turn assigned', drawTurn, turnUser: userId })}

`);
    }
  };

  // Listen for dynamic game/room changes published on the user's channel
  subscriber.on('message', async (channel:string, message: string) => {
      try {
         const data = JSON.parse(message);
         if (['join_game', 'leave_game', 'join_room', 'leave_room', 'new_draw_turn_assigned', 'new_guess_turn_assigned'].includes(data.type)) {
              await handleChannelChange(data);
         } else {
             console.log(`Unhandled user event on channel ${channel}:`, data);
         }
      } catch (error) {
         console.error('Error parsing user channel message:', error);
      }
  });

  // Return the stream response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}