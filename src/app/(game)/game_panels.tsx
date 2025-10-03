'use client'
import {GameDrawing, User} from "@/lib/data_definitions";
import {Button} from "@/components/button";
import {Brush} from "lucide-react";
import React from "react";


export default function GamePanels ({userColors, userId, gameId, roomId, drawings, nextPlayerUser, setIsPlaying, isFullGame} : {userColors: {[name:string]: string }, userId: string, gameId: string, roomId?: string, drawings: (GameDrawing&{shuffle_available:boolean})[], nextPlayerUser: User|null, setIsPlaying?: (gameId: string|null) => void, isFullGame?: boolean}) {
    let myTurn = false;
    let isDrawing = false;
    let isGuessing = false;
    let nextPlayer:string|null;
    if (nextPlayerUser !== null && nextPlayerUser !== null)  nextPlayer = nextPlayerUser.name;
    else nextPlayer = null
    const turns = [];

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
        turn.isMe || isFullGame);
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
    console.log(alreadyFinished, isDrawing, isGuessing, myTurn, userColors)
    return (
        <div className={"inline-flex mt-5 ml-3"}>
            {roomId &&
            <div className={"w-24 h-24 overflow-hidden text-ellipsis mr-5"}>
                <UserTag userColors={userColors} name={firstDrawing.drawer_name}/>{`'s drawing`}
            </div>
            }
            {!myTurn || gameDone ?
                <div className={"flex flex-row"}>
                    
                    {alreadyFinished &&
                <GameOverview userColors={userColors} firstDrawing={firstDrawing} gameDone={gameDone} alreadyFinished={alreadyFinished}
                              turns={turns} nextPlayer={nextPlayer} isGuessing={isGuessing} curPlayer={curPlayer} userId={userId}
                              finalTurnDiv={(isFullGame || !gameDone) ?
                              <GameOverviewPrePlay 
                              userColors={userColors} nextPlayer={nextPlayer} isGuessing={isGuessing} curPlayer={curPlayer} gameDone={gameDone}
                              shuffleAvailable={lastDrawing.shuffle_available}/> : undefined}/>}

                
                </div>
                :
                <div className='w-40 h-40 ml-3'>
                    {
                        myTurn ? isDrawing ?
                                <Button className={'bg-blue-500 text-white h-20'} onClick={() => setIsPlaying && setIsPlaying(gameId)}>{lastDrawing.guesser_name === null ?`Draw your word!` : `Draw ${lastDrawing.guesser_name}'s guess`} <Brush
                                    size={30}/></Button>:
                                <Button className={'bg-blue-500 text-white h-20'} onClick={() => setIsPlaying && setIsPlaying(gameId)}>{`Guess ${drawingsById[lastDrawing.prev_game_drawing_id].drawer_name}'s drawing! `}</Button> :
                            <div><UserTag userColors={userColors} name={curPlayer}/>
                                <p>{`is ${isGuessing ? 'guessing' : 'drawing'}`}</p></div>
                    }

                </div>
            }

        </div>
    )
}
function GameOverviewPrePlay({userColors, nextPlayer, isGuessing, curPlayer, gameDone, shuffleAvailable} : {gameDone: boolean, userColors: {[name:string]: string},  nextPlayer:string|null, isGuessing: boolean, curPlayer:string, shuffleAvailable:boolean}) {
    return (<div className={'inline-flex'}>
        {!gameDone ?
        <div className='w-40 h-40 ml-3'><UserTag userColors={userColors} name={curPlayer}/>
            {`'s turn`}
            <br/>
            <br/>
            {nextPlayer && <span><UserTag userColors={userColors}
                                          name={nextPlayer}/>
                {` is ${isGuessing ? "drawing" : "guessing"} next`}</span>}</div>
            :shuffleAvailable && <div>{`Waiting for someone to ${isGuessing ? "draw" : "guess"}`}</div>}
</div>)
}

function GameOverview({userColors, firstDrawing, alreadyFinished, turns, userId, finalTurnDiv} :
    {userColors: {[name:string]: string},  nextPlayer:string|null, isGuessing: boolean, curPlayer:string, firstDrawing:GameDrawing, gameDone: boolean, alreadyFinished:boolean, turns:(GameDrawing&{isDraw: boolean})[], userId: string, finalTurnDiv?: React.ReactElement}) {
    
    // Calculate grid dimensions based on number of turns
    const panels = turns.toReversed().map((turn, idx) => {
                    return turn.isDraw ? (
                        <div className={`w-48 h-48`} key={idx}><UserTag userColors={userColors}
                                                                             name={turn.drawer_id == userId? 'You': turn.drawer_name}/>{` drew `}
                            {alreadyFinished ? <img className={'border border-gray-200 rounded-md p- w-40 h-40 mx-auto'} alt='past drawing'
                                                    src={`${turn.signed_url}`}/> :
                                null}
                        </div>) : (<div className={"w-40 h-40"}
                                        key={idx}><UserTag userColors={userColors} name={turn.guesser_id == userId? 'You': turn.guesser_name}/>
                        <p>{`guessed${alreadyFinished ? ` ${turn.target_word}` : ""}`}</p></div>)
                });
    if (finalTurnDiv) {
        panels.push(<div className={`w-48 h-48`} key={turns.length + 1}>{finalTurnDiv}</div>);
    }
    const numTurns = panels.length;
    let rows, cols;
    
    if (numTurns <= 2) {
        rows = 1;
        cols = 2;
    }else if (numTurns <= 4) {
        rows = 2;
        cols = 2;
    } else if (numTurns <= 6) {
        rows = 2;
        cols = 3;
    } else if (numTurns <= 8) {
        rows = 2;
        cols = 4;
    } else if (numTurns <= 12) {
        rows = 3;
        cols = 4;
    } else {
        rows = 4;
        cols = 4;
    }
    
    const colClassMap:{[key: number]: string} = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
    };
    
    const rowClassMap:{[key: number]: string} = {
        1: 'grid-rows-1',
        2: 'grid-rows-2',
        3: 'grid-rows-3',
        4: 'grid-rows-4',
    };

    const colClass = colClassMap[cols] || 'grid-cols-2';
    const rowClass = rowClassMap[rows] || 'grid-rows-1';
    const gridClasses = `grid grid-cols-2 ${colClass} ${rowClass} gap-3`;
    return (
        <div className={"flex flex-col text-center"}>
            <div
                className={"h-12 overflow-hidden text-ellipsis"}>
                {`The word is: ${alreadyFinished ? firstDrawing.target_word : '_______'}`}
            </div>
            <div className={`${gridClasses}`}>
            {
                panels
            }
            </div>
        </div>
    )
}

function UserTag({userColors, name}: { userColors: { [name: string]: string }, name: string }) {
    return (<span className={userColors[name]}><strong>{name}</strong></span> )
}
