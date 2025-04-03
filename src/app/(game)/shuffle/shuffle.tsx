'use client';
import React, {useEffect, useState} from "react";
import GamePanels from "@/app/(game)/game_panels";
import Pull from "@/app/(game)/shuffle/pull";
import Canvas from "@/app/(game)/canvas/[game_drawing_id]/canvas";
import Guess from "@/app/(game)/guess/[game_drawing_id]/guess";
import {getShuffleGames} from "@/lib/api";
import {GameDrawing} from "@/lib/data_definitions";
import {Button} from "@/components/button";

export default function Shuffle({userId}:{userId:string}) {
    const [games, setGames] = useState<(GameDrawing&{turnUser:null|string, drawTurn:null|boolean, signedUrl: string})[]>([]);
    const [updatesMode, setUpdatesMode] = useState<boolean>(false);
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
    if (myTurnGames.length > 0) {
        const drawing = myTurnGames[0];
        if (myTurnGames[0].drawTurn) return <Canvas
            drawing={drawing}
            secretWord={drawing.target_word}/>
        else return <Guess gameDrawing={drawing} imageUrl={drawing.signedUrl}/>
    }
    const updates = pastGames.toSorted(
        (a,b) => new Date(b.updated_at).valueOf() - new Date(a.updated_at).valueOf())
    return (
        <div>
            <div className={"space-x-3"}>
                <Pull/>
                <Button onClick={()=>setUpdatesMode(false)} disabled={!updatesMode}>All Games</Button>
                <Button onClick={()=>setUpdatesMode(true)} disabled={updatesMode}>Updates</Button>
            </div>
            {myTurnGames.map((game, idx) => (
                <div key={idx}>
                    <GamePanels userColors={{}} userId={userId} gameId={game.game_id}/>
                </div>
            ))}
            {(updatesMode? updates : pastGames).map((game, idx) => (
                <div key={idx}>
                    <GamePanels userColors={{}} userId={userId} gameId={game.game_id}/>
                </div>
            ))}
        </div>
    )
}