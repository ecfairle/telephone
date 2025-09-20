'use client';
import React, { useEffect, useState } from "react";
import GamePanels from "@/app/(game)/game_panels";
import Canvas from "@/app/(game)/canvas/[game_drawing_id]/canvas";
import Guess from "@/app/(game)/guess/[game_drawing_id]/guess";
import { pullShuffle } from "@/lib/api";
import { GameDrawing, User } from "@/lib/data_definitions";
import { Button } from "@/components/button";
import { Loader } from "lucide-react";
import { createPortal } from "react-dom";

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
  // const [updatesMode, setUpdatesMode] = useState<boolean>(false);
  const [pullLoading, setPullLoading] = useState<boolean>(false);
  const [showNoGamesModal, setShowNoGamesModal] = useState<boolean>(false);
  const { connectionStatus, userGames, gameData } = useGameEvents();
  if (connectionStatus === 'disconnected' || pullLoading) {
      return <div className='container mx-auto max-w-fit justify-center text-center flex h-screen'>
    <Loader className={'text-blue-500 animate-spin m-auto'} size={100} /></div>
  }

  const userPlaying = userGames.some(game => game.turnUser === userId);
  return (
      <>
        {<>
          {!userPlaying &&
            <div className={"space-x-3 justify-center text-center flex"}>
              <Button variant={'blue'} size={'xl'} className="w-40" disabled={pullLoading} onClick={async () => {
                setPullLoading(true);
                const result = await pullShuffle();
                setPullLoading(false);
                
                // Check if the result contains any games
                if (!result || (Array.isArray(result) && result.length === 0)) {
                  setShowNoGamesModal(true);
                }
              }}>Find Games</Button>
              {/* <Button onClick={() => setUpdatesMode(false)} disabled={!updatesMode}>All Games</Button>
              <Button onClick={() => setUpdatesMode(true)} disabled={updatesMode}>Updates</Button> */}
            </div>
          }
            {userPlaying ? 
            userGames.filter(game => game.turnUser === userId).map(game => {
              return (
                <div key={game.game_id} className={game.game_id === userGames.filter(game => game.turnUser === userId).sort((game) => new Date(game.created_at).getDate())[0].game_id ? '' : 'hidden'}>
                  {game.drawTurn ?
                    <Canvas
                      drawing={game}
                      secretWord={game.target_word} />
                    :
                    <Guess gameDrawing={game} imageUrl={game.signedUrl} />}
                </div>
              );
            }) 
            :
            <div className="mt-5">
            Past Games:
            {userGames.filter(game => game.turnUser !== userId).map((game, idx) => (
            <div key={idx}>
              <GamePanels userColors={{}} userId={userId} gameId={game.game_id} drawings={gameData.drawings[game.game_id].drawings} nextPlayerUser={gameData.nextPlayers[game.game_id]} />
            </div>
          ))}
          </div>
          }
        </>
        }
        
      {/* Modal for no games found */}
      {showNoGamesModal && createPortal(
        <div className="modal">
          <div className={"wrap text-center"}>
            <h3 className="text-lg font-medium mb-4">No Games Found</h3>
            <Button variant={'blue'} onClick={() => setShowNoGamesModal(false)}>Close</Button>
          </div></div>,
        document.body
        )}
      </>
  )
}
