'use client';
import React, { useEffect, useState } from "react";
import GamePanels from "@/app/(game)/game_panels";
import Canvas from "@/app/(game)/canvas/[game_drawing_id]/canvas";
import Guess from "@/app/(game)/guess/[game_drawing_id]/guess";
import { getShuffleGames, pullShuffle } from "@/lib/api";
import { GameDrawing, User } from "@/lib/data_definitions";
import { Button } from "@/components/button";
import { Loader } from "lucide-react";
import { unreserveDrawing } from "@/lib/api";

export function useGameEvents() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userGames, setUserGames] = useState<(GameDrawing & { turnUser: string, drawTurn: boolean, signedUrl: string })[]>([]);
  const [gameData, setGameData] = useState<{
    drawings: { [game_id: string]: {drawings: (GameDrawing&{shuffle_available:boolean})[]} };
    nextPlayers: { [game_id: string]: User|null };
  }>({drawings: {}, nextPlayers: {} });

  useEffect(() => {
    // EventSource will automatically include session cookies
    const eventSource = new EventSource('/api/events');

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
            break;

          case 'game_update':
            setGameData(prev => ({ ...prev, drawings: { ...prev.drawings, [data.gameId]: data.gameData.drawings[data.gameId] }, nextPlayers: { ...prev.nextPlayers, [data.gameId]: data.gameData.nextPlayers[data.gameId] } }));
            setUserGames(prevUserGames => prevUserGames.map(game => {
              if (game.game_id == data.gameId) {
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
    userGames, gameData
  };
}

export default function Shuffle({ userId }: { userId: string }) {
  const [updatesMode, setUpdatesMode] = useState<boolean>(false);
  const [pullLoading, setPullLoading] = useState<boolean>(false);
  const { connectionStatus, userGames, gameData } = useGameEvents();

  if (connectionStatus === 'disconnected') {
      return <div className='container mx-auto max-w-fit justify-center text-center flex h-screen'>
    <Loader className={'text-blue-500 animate-spin m-auto'} size={100} /></div>
  }

  return (
      <div>
        {<div>
          <div className={"space-x-3"}>
            <Button variant={'blue'} size={'lg'} disabled={pullLoading} onClick={async () => {
              // setPullLoading(true);
              await pullShuffle();
              const res = await getShuffleGames();
              const result: (GameDrawing & {
                turnUser: null | string,
                drawTurn: null | boolean,
                signedUrl: string
              })[] = await res.json();
              setPullLoading(false);
            }}>Play!</Button>
            <Button onClick={() => setUpdatesMode(false)} disabled={!updatesMode}>All Games</Button>
            <Button onClick={() => setUpdatesMode(true)} disabled={updatesMode}>Updates</Button>
          </div>
          <div>
            {userGames.filter(game => game.turnUser === userId).map(game => {
              return (
                <div key={game.game_id} className={game.game_id === userGames.filter(game => game.turnUser === userId)[0].game_id ? '' : 'hidden'}>
                  {game.drawTurn ?
                    <Canvas
                      drawing={game}
                      secretWord={game.target_word} />
                    :
                    <Guess gameDrawing={game} imageUrl={game.signedUrl} />}
                </div>
              );
            })}
          </div>
          {!userGames.some(game => game.turnUser === userId) && userGames.filter(game => game.turnUser !== userId).map((game, idx) => (
            <div key={idx}>
              <GamePanels userColors={{}} userId={userId} gameId={game.game_id} drawings={gameData.drawings[game.game_id].drawings} nextPlayerUser={gameData.nextPlayers[game.game_id]} />
            </div>
          ))}
        </div>
        }
      </div>
  )
}