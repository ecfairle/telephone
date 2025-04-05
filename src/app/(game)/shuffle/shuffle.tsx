'use client';
import React, {useEffect, useState} from "react";
import GamePanels from "@/app/(game)/game_panels";
import Canvas from "@/app/(game)/canvas/[game_drawing_id]/canvas";
import Guess from "@/app/(game)/guess/[game_drawing_id]/guess";
import {getShuffleGames, pullShuffle} from "@/lib/api";
import {GameDrawing} from "@/lib/data_definitions";
import {Button} from "@/components/button";
import {Loader} from "lucide-react";

export default function Shuffle({userId}:{userId:string}) {
    const [games, setGames] = useState<(GameDrawing&{turnUser:null|string, drawTurn:null|boolean, signedUrl: string})[]>([]);
    const [updatesMode, setUpdatesMode] = useState<boolean>(false);
    const [pullLoading, setPullLoading] = useState<boolean>(false);
    useEffect(() => {
        const fetchGamesData = async () => {
            try {
                const res = await getShuffleGames();
                const result:(GameDrawing&{turnUser:null|string, drawTurn:null|boolean, signedUrl: string})[] = await res.json();
                setGames(result);
            } catch(error) {
                console.log('ERROR fetching SHUFFLE', error);
            }
        }
        fetchGamesData();
        const intervalId = setInterval(fetchGamesData, 5000); // Fetch every 5 seconds
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);
    const myTurnGames = games.filter(game => game.turnUser === userId);
    const pastGames = games.filter(game => game.turnUser !== userId);
    const updates = pastGames.toSorted(
        (a,b) => new Date(b.updated_at).valueOf() - new Date(a.updated_at).valueOf())
    return (
        pullLoading? <div className='container mx-auto max-w-fit justify-center text-center flex h-screen'>
                <Loader className={'text-blue-500 animate-spin m-auto'} size={100}/></div>
            :
            <div>
                {myTurnGames.length > 0?
                    myTurnGames.map((drawing, idx) => (
                        <div className={idx !== 0 ? 'hidden' : ''} key={drawing.id}>
                            {drawing.drawTurn ?
                            <Canvas
                                drawing={drawing}
                                secretWord={drawing.target_word}/>
                            :
                            <Guess gameDrawing={drawing} imageUrl={drawing.signedUrl}/>}
                        </div>))
                    :
                    <div>
                    <div className={"space-x-3"}>
                        <Button variant={'blue'} size={'lg'} disabled={pullLoading} onClick={async () => {
                            setPullLoading(true);
                            await pullShuffle();
                            const res = await getShuffleGames();
                            const result: (GameDrawing & {
                                turnUser: null | string,
                                drawTurn: null | boolean,
                                signedUrl: string
                            })[] = await res.json();
                            setGames(result);
                            setPullLoading(false);
                        }}>Play!</Button>
                        <Button onClick={() => setUpdatesMode(false)} disabled={!updatesMode}>All Games</Button>
                        <Button onClick={() => setUpdatesMode(true)} disabled={updatesMode}>Updates</Button>
                    </div>
                    {(updatesMode ? updates : pastGames).map((game, idx) => (
                        <div key={idx}>
                            <GamePanels userColors={{}} userId={userId} gameId={game.game_id}/>
                        </div>
                    ))}
                    </div>
                }
            </div>
    )
}