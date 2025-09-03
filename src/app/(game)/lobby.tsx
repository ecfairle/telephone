'use client'
import GamePanels from "@/app/(game)/game_panels";
import ShareLink from "@/app/(game)/share_link";
import { leaveRoom, startNewGame} from "@/lib/api";
import React, {useEffect, useState} from "react";
import {User} from "@/lib/data_definitions";
import {Button} from "@/components/button";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";
import GameBlurb from "@/app/(game)/game_blurb";
import {GameDrawing} from "@/lib/data_definitions";
import Canvas from "@/app/(game)/canvas/[game_drawing_id]/canvas";
import Guess from "@/app/(game)/guess/[game_drawing_id]/guess";
import {Loader} from "lucide-react";

const colors = [
    'text-blue-500', 'text-red-500', 'text-green-500', 'text-amber-500', 'text-violet-500'
];

export function useGameEvents(roomId: string, userId: string, setIsPlaying: (gameId: string|null) => void) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [roomies, setRoomies] = useState<User[]>([]);
  const [userGames, setUserGames] = useState<(GameDrawing & { turnUser: string, drawTurn: boolean, signedUrl: string })[]>([]);
  const [gameData, setGameData] = useState<{
    drawings: { [game_id: string]: {drawings: (GameDrawing&{shuffle_available:boolean})[]} };
    nextPlayers: { [game_id: string]: User|null };
  }>({drawings: {}, nextPlayers: {} });

  useEffect(() => {
    // EventSource will automatically include session cookies
    const eventSource = new EventSource(`/api/events/${roomId}`);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE event data', data)
        switch (data.type) {
          case 'connected':
            setUserGames(data.games);
            setGameData(data.gameData);
            setRoomies(data.roomies);
            break;
          case 'game_update':
            setGameData(prev => ({ ...prev, drawings: { ...prev.drawings, [data.gameId]: data.gameData.drawings[data.gameId] }, nextPlayers: { ...prev.nextPlayers, [data.gameId]: data.gameData.nextPlayers[data.gameId] } }));
            setUserGames(prevUserGames => prevUserGames.map(game => {
              if (game.game_id == data.gameId) {
                if (game.turnUser === userId && !(data.game.turnUser === userId)) {
                    setIsPlaying(null);
                }
                return { ...game, ...data.game };
              }
              return game;
            }));
            console.log('game update', userGames);
            break;
          case 'game_joined':
            setUserGames(prev => [...prev, data.gameData]);
            break;
          case 'game_left':
            setUserGames(prev => prev.filter(game => game.game_id !== data.gameId));
            break;
           case 'leave_room':
            setRoomies(prev => prev.filter(user => user.id !== data.userId));
            break;
           case 'join_room':
            setRoomies(prev => [...prev, data.user]);
            break;
           case 'start_game':
            setUserGames(data.games);
            setGameData(data.gameData);
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('error');
    };

    return () => {
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, []);

  return {
    connectionStatus,
    userGames, gameData,
    roomies
  };
}

export default function Lobby({roomId, userId} :{roomId: string, userId: string, users: User[], gamesMap:{ [game_id: string]: {name: string}[] }}) {
    const [isPlaying, setIsPlaying] = useState(null as string|null);
    const { connectionStatus, userGames, gameData, roomies} = useGameEvents(roomId, userId, setIsPlaying);    
    async function handleNewGameClick() {
        await startNewGame(roomId);
        router.refresh();
    }

    async function handleLeaveRoomClick() {
        await leaveRoom(session?.data?.user.userId as string, roomId);
        router.push('/');
    }

    const router = useRouter();
    const session = useSession();

    if (connectionStatus === 'disconnected') {
        return <div className='container mx-auto max-w-fit justify-center text-center flex h-screen'>
      <Loader className={'text-blue-500 animate-spin m-auto'} size={100} /></div>
    }
    const userColors = roomies.reduce((prev, cur, idx) => ({[cur.name]: colors[idx],  ...prev}), {});
    return (<div className={"flex flex-col container"}>
            <div className={''}>
                 <Button className={'text-white bg-red-500 mr-5'} onClick={handleLeaveRoomClick}>Leave Room</Button>
                {Object.keys(userGames).length === 0 && <Button disabled={!(userGames.length === 0 && roomies.length > 1)} onClick={handleNewGameClick}>Start Game</Button>}
            </div>
            {Object.keys(userGames).length === 0 ?
                <div>
                    <div className={""}>
                        {roomies.map((user) => {
                            return (
                                <div key={user.id} className='w-24 h-18 mt-10 truncate'><UserTag userColors={userColors}
                                                                                                 name={user.name}/>
                                    <img className={'w-12 h-12'} src={user.image}/>
                                </div>)
                        })
                        }
                        {Array.from({length: 5 - roomies.length}, (v, k) => k + 1).map((idx) => (
                            <div key={idx}><ShareLink roomId={roomId} showTooltip={idx === 1}></ShareLink>
                            </div>
                        ))}
                    </div>
                    <GameBlurb/>
                </div>
                :
                <div className={'flex flex-col mt-8'}>
                    {userGames.filter(game => game.turnUser === userId && isPlaying === game.game_id).map(game => {
                                  return (
                                    <div key={game.game_id} className={game.game_id === userGames.filter(game => game.turnUser === userId)[0].game_id ? '' : 'hidden'}>
                                      {game.drawTurn ?
                                        <Canvas
                                          roomId={roomId}
                                          drawing={game}
                                          secretWord={game.target_word} />
                                        :
                                        <Guess roomId={roomId} gameDrawing={game} imageUrl={game.signedUrl} />}
                                    </div>
                                  );
                                })}
                              {!isPlaying &&userGames.map((game, idx) => (
                                <div key={idx}>
                                  <GamePanels roomId={roomId} userColors={{}} userId={userId} gameId={game.game_id} drawings={gameData.drawings[game.game_id].drawings} nextPlayerUser={gameData.nextPlayers[game.game_id]} setIsPlaying={setIsPlaying} />
                                </div>
                              ))}
                </div>
            }
        </div>
    )
}

function UserTag({userColors, name}: { userColors: { [name: string]: string }, name: string }) {
    return (<span className={userColors[name]}><strong>{name}</strong></span>)
}