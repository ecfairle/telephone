'use client'
import {GameDrawing} from "@/lib/data_definitions";
import {Button} from "@/components/button";
import Link from "next/link";
import {startNewGameFromOld} from "@/lib/api";

export default function ListGame ({drawings, userId, gameId} : {drawings: GameDrawing[], userId: string, gameId:string}) {
    let alreadyFinished = false;
    let myTurn = false;
    let isDrawing = false;
    let isGuessing = false;
    let someoneElse = null;
    let someoneElseGuessing = false;
    console.log(drawings, userId)
    const turns = [];
    for (const drawing of drawings) {
        if (drawing.guesser_id !== null && drawing.target_word !== null) {
            turns.push({
                ...drawing,
                isDraw: false,
                isMe: drawing.guesser_id === userId,
                userId: drawing.guesser_id
            })
        }
        if (drawing.drawer_id !== null && drawing.drawing_done) {
            turns.push({
                ...drawing,
                isDraw: true,
                isMe: drawing.drawer_id === userId,
                userId: drawing.drawer_id
            })
        }
    }
    for (const drawing of drawings) {
        if (drawing.guesser_id === userId) {
            isGuessing = true;
            if (drawing.target_word === null) {
                myTurn = true;
                break;
            }
            else {
                alreadyFinished = true;
                break;
            }
        }
        if (drawing.drawer_id === userId) {
            isDrawing = true;
            if (drawing.drawing_done) {
                alreadyFinished = true;
                break;
            }
            else {
                myTurn = true;
                break;
            }
        }
    }
    if (!isDrawing && !isGuessing) {
        for (const drawing of drawings) {
            if (!drawing.drawing_done && drawing.target_word !== null) {
                if (drawing.drawer_id === null) {
                    isDrawing = true;
                } else {
                    someoneElse = drawing.drawer_name;
                }
                break;
            }
            if (drawing.target_word === null) {
                if (drawing.guesser_id === null) {
                    isGuessing = true;
                }
                else {
                    someoneElse = drawing.guesser_name;
                    someoneElseGuessing = true;
                }
                break;
            }
        }
    }
    console.log(alreadyFinished, isDrawing, isGuessing, myTurn)
    return (<div>
            <Button onClick={() => {navigator.clipboard.writeText(`localhost:3000/join_game/${gameId}`)}}>Share Link</Button>
            <Button onClick={() => startNewGameFromOld(gameId)}>New Game</Button>
            {alreadyFinished ?
                <div className={"flex w-1/2"}>
                    {
                        turns.map((turn, idx) => {
                            return turn.isDraw? (
                                <div className={"flex-1"} key={idx}>{`${turn.isMe ? "You" : turn.drawer_name} drew `}<img className={''} alt='past drawing'
                                                                                                                          src={`${turn.signed_url}`}/>
                                </div>) : (<div className={"flex-1"}  key={idx}>{`${turn.isMe ? "You" : turn.guesser_name} guessed "${turn.target_word}"`}</div>)
                        })}
                </div> :
                isDrawing ?
                    myTurn ?
                        <Link
                            href={{
                                pathname: `/canvas/${drawings.at(-1)?.id}`}}
                        > {"FINISH DRAWING"}</Link> :
                        <Link
                            href={{
                                pathname: `/canvas/${drawings.at(-1)?.id}`}}
                        > {"DRAW a drawing"}</Link> :
                    isGuessing ?
                        myTurn ?
                            <Link href={{pathname: `/guess/${drawings.at(-1)?.id}`}}><p>{`FINISH GUESSING`}</p></Link> :
                            <Link href={{pathname: `/guess/${drawings.at(-1)?.id}`}}><p>{`TRY GUESSING`}</p></Link> :
                        someoneElse ? `${someoneElse} is ${someoneElseGuessing? 'guessing' : 'drawing'}`: 'invalid state.'

            }
        </div>
    )
}