'use client'
import {GameDrawing, User} from "@/lib/data_definitions";
import Link from "next/link";
import {useEffect, useState} from "react";
import {getGame} from "@/lib/api";
import {Button} from "@/components/button";
import {Brush} from "lucide-react";


export default function GamePanels ({userColors, userId, gameId} : {userColors: {[name:string]: string }, userId: string, gameId: string}) {
    let myTurn = false;
    let isDrawing = false;
    let isGuessing = false;
    const [drawings, setDrawings] = useState<GameDrawing[]>([]);
    const [nextPlayer, setNextPlayer] = useState<string|null>(null);
    console.log('gameId ', gameId);
    const turns = [];
    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const res = await getGame(gameId);
                const result:{drawings: {[game_id:string]: GameDrawing[]}, next_players: {[game_id:string]: User} } = await res.json();
                setDrawings(result['drawings'][gameId]);
                if (gameId in result['next_players'] && result['next_players'][gameId] !== null)  setNextPlayer(result['next_players'][gameId]['name']);
                else setNextPlayer(null);
            } catch {

            }
        }
        fetchGameData();
        const intervalId = setInterval(fetchGameData, 5000); // Fetch every 5 seconds
        return () => clearInterval(intervalId); // Cleanup on unmount
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
    const drawingsById : {[id: string]: GameDrawing} = drawings.reduce((prev, cur) => {
        return {...prev, [cur.id]: cur}
    }, {})
    const lastDrawing = drawings[0];
    const firstDrawing = drawings.slice(-1)[0];
    const alreadyFinished = turns.some((turn) =>
        turn.isMe);
    const gameDone = (lastDrawing.target_word !== null && lastDrawing.drawer_id === null) ||
        (lastDrawing.drawing_done);
    console.log('LAST DRAWING', lastDrawing.id);
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
    console.log(alreadyFinished, isDrawing, isGuessing, myTurn, userColors)
    return (
        <div className={"inline-flex mt-5 ml-3"}>
            <div className={"w-24 h-24 overflow-hidden text-ellipsis"}><UserTag userColors={userColors}
                                                                                name={firstDrawing.drawer_name}/>{`'s drawing`}
            </div>
            {!myTurn || gameDone ?
                <div className={"flex flex-row"}>
                    {alreadyFinished &&
                <GameOverview userColors={userColors} firstDrawing={firstDrawing} gameDone={gameDone} alreadyFinished={alreadyFinished}
                              turns={turns} nextPlayer={nextPlayer} isGuessing={isGuessing} curPlayer={curPlayer}/>}
                <GameOverviewPrePlay userColors={userColors} nextPlayer={nextPlayer} isGuessing={isGuessing} curPlayer={curPlayer} gameDone={gameDone}/>
                </div>
                :
                <div className='w-40 h-40 ml-3'>
                    {
                        myTurn ? isDrawing ?
                                <Link
                                    href={{
                                        pathname: `/canvas/${lastDrawing.id}`
                                    }}
                                > <Button className={'bg-blue-500 text-white h-20'}>{lastDrawing.guesser_name === null ?`Draw your word!` : `Draw ${lastDrawing.guesser_name}'s guess`} <Brush
                                    size={30}/></Button></Link> :
                                <Link href={{pathname: `/guess/${lastDrawing.id}`}}><Button
                                    className={'bg-blue-500 text-white h-20'}>{`Guess ${drawingsById[lastDrawing.prev_game_drawing_id].drawer_name}'s drawing! `}</Button></Link> :
                            <div><UserTag userColors={userColors} name={curPlayer}/>
                                <p>{`is ${isGuessing ? 'guessing' : 'drawing'}`}</p></div>
                    }

                </div>
            }

        </div>
    )
}
function GameOverviewPrePlay({userColors, nextPlayer, isGuessing, curPlayer, gameDone} : {gameDone: boolean, userColors: {[name:string]: string},  nextPlayer:string|null, isGuessing: boolean, curPlayer:string}) {
    return (<div className={'inline-flex'}>
        {!gameDone ?
        <div className='w-40 h-40 ml-3'><UserTag userColors={userColors} name={curPlayer}/>
            {`'s turn`}
            <br/>
            <br/>
            {nextPlayer && <span><UserTag userColors={userColors}
                                          name={nextPlayer}/>
                {` is ${isGuessing ? "drawing" : "guessing"} next`}</span>}</div>
            :null}
    </div>)
}

function GameOverview({userColors, firstDrawing, alreadyFinished, turns} :
    {userColors: {[name:string]: string},  nextPlayer:string|null, isGuessing: boolean, curPlayer:string, firstDrawing:GameDrawing, gameDone: boolean, alreadyFinished:boolean, turns:(GameDrawing&{isDraw: boolean})[]}) {
    return (
        <div className={"inline-flex"}>
            <div
                className={"w-24 h-24 ml-5 overflow-hidden text-ellipsis"}>
                {`The word is: ${alreadyFinished ? firstDrawing.target_word : '_______'}`}
            </div>
            {
                turns.toReversed().map((turn, idx) => {
                    return turn.isDraw ? (
                        <div className={`w-80 h-80 ml-5`} key={idx}><UserTag userColors={userColors}
                                                                             name={turn.drawer_name}/>{` drew `}
                            {alreadyFinished ? <img className={'border w-64 h-64'} alt='past drawing'
                                                    src={`${turn.signed_url}`}/> :
                                null}
                        </div>) : (<div className={"w-80 h-80 ml-5"}
                                        key={idx}><UserTag userColors={userColors} name={turn.guesser_name}/>
                        <p>{`guessed${alreadyFinished ? ` ${turn.target_word}` : ""}`}</p></div>)
                })
            }
        </div>
    )
}

function UserTag({userColors, name}: { userColors: { [name: string]: string }, name: string }) {
    return (<span className={userColors[name]}><strong>{name}</strong></span> )
}