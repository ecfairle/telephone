'use client'
import {GameDrawing} from "@/lib/data_definitions";
import Link from "next/link";
import {useEffect, useState} from "react";
import {getGame} from "@/lib/api";


export default function ListGame ({initDrawings, userId} : {initDrawings: GameDrawing[], userId: string}) {
    let myTurn = false;
    let isDrawing = false;
    let isGuessing = false;
    const [drawings, setDrawings] = useState(initDrawings);
    const gameId = drawings[0].game_id;
    const turns = [];
    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const res = await getGame(gameId);
                const result = await res.json();
                setDrawings(result['drawings']);
            } catch {

            } finally {
                setTimeout(fetchGameData, 5000);
            }


        }
        fetchGameData();
        }, [gameId])

    for (const drawing of drawings) {
        if (drawing.drawer_id !== null && drawing.drawing_done) {
            turns.push({
                ...drawing,
                isDraw: true,
                isMe: drawing.drawer_id === userId,
                userId: drawing.drawer_id
            })
        }
        if (drawing.guesser_id !== null && drawing.target_word !== null) {
            turns.push({
                ...drawing,
                isDraw: false,
                isMe: drawing.guesser_id === userId,
                userId: drawing.guesser_id
            })
        }
    }
    if (drawings.length === 0) {
        return null;
    }
    const lastDrawing = drawings[0];
    const firstDrawing = drawings.slice(-1)[0];
    const alreadyFinished = turns.some((turn) =>
        turn.isMe);
    const gameDone = (lastDrawing.target_word !== null && lastDrawing.drawer_id === null) ||
        (lastDrawing.drawing_done);
    let curPlayer = null;
    if (lastDrawing.drawer_id === null) {
        // guess turn
        isGuessing = true;
        curPlayer = lastDrawing.guesser_name;
        if (lastDrawing.guesser_id === userId) {
            myTurn = true;
        }
    } else {
        curPlayer = lastDrawing.drawer_name;
        isDrawing = true;
        if (lastDrawing.drawer_id === userId) {
            myTurn = true;
        }
    }
    console.log(alreadyFinished, isDrawing, isGuessing, myTurn)
    return (
        <div className={"inline-flex mt-5 ml-5"}>
            <div className={"w-24 h-24 overflow-hidden text-ellipsis"}>{`${firstDrawing.drawer_name}'s drawing`}</div>
            <div className={"w-24 h-24 ml-5 overflow-hidden text-ellipsis"}>{`The word is: ${alreadyFinished? firstDrawing.target_word : '_______'}`}</div>
            {
                turns.reverse().map((turn, idx) => {
                    return turn.isDraw ? (
                        <div className={"w-80 h-80 ml-5"} key={idx}>{`${turn.isMe ? "You" : turn.drawer_name} drew `}
                            {alreadyFinished ? <img className={'border w-64 h-64'} alt='past drawing'
                                                    src={`${turn.signed_url}`}/> :
                                <div className='w-64 h-64 bg-black'></div>}
                        </div>) : (<div className={"ml-5"}
                                        key={idx}>{`${turn.isMe ? "You" : turn.guesser_name} guessed "${alreadyFinished? turn.target_word : '_______'}"`}</div>)
                })
            }
            {!gameDone &&
                <div className='w-80 h-80 ml-5'>
                    {
                        myTurn ? isDrawing ?
                                <Link
                                    href={{
                                        pathname: `/canvas/${lastDrawing.id}`
                                    }}
                                > {"Your turn to draw"}</Link> :
                                <Link href={{pathname: `/guess/${lastDrawing.id}`}}><p>{`Your turn to guess`}</p></Link> :
                            <p>{`${curPlayer} is ${isGuessing ? 'guessing' : 'drawing'}`}</p>
                    }
                </div>
            }
        </div>
    )
}