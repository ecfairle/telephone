'use client'
import GamePanels from "@/app/(game)/game_panels";
import ShareLink from "@/app/(game)/share_link";
import {getRoomData, leaveRoom, startNewGame} from "@/lib/api";
import React, {useEffect, useState} from "react";
import {User} from "@/lib/data_definitions";
import {Button} from "@/components/button";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";

const colors = [
    'text-blue-500', 'text-red-500', 'text-green-500', 'text-amber-500', 'text-violet-500'
];

export default function Lobby({roomId, userId, users, gamesMap} :{roomId: string, userId: string, users: User[], gamesMap:{ [game_id: string]: {name: string}[] }}) {
    const [roomies, setRoomies] = useState<User[]>(users);
    const [games, setGames] = useState(gamesMap);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const res = await getRoomData();
                const result : {games: { [game_id: string]: {name: string}[] }, roomies: User[], room_id: string} = await res.json();
                setGames(result['games']);
                setRoomies(result['roomies']);
            } catch(error) {
                console.log('error' + error)
            }
        }
        fetchRoomData();
        const intervalId = setInterval(fetchRoomData, 5000); // Fetch every 5 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    async function handleNewGameClick() {
        await startNewGame(roomId);
        router.refresh();
    }

    async function handleLeaveRoomClick() {
        await leaveRoom(session?.data?.user.userId as string);
        router.refresh();
    }

    const router = useRouter();
    const session = useSession();

    const userColors = roomies.reduce((prev, cur, idx) => ({[cur.name]: colors[idx],  ...prev}), {});
    return (<div className={"ml-5  container"}>
            <div className={'flex flex-row'}>
                {roomies.length > 1 && <Button className={'mr-5'} onClick={handleLeaveRoomClick}>Leave Room</Button>}
                {Object.keys(games).length === 0 && roomies.length > 1 && <Button onClick={handleNewGameClick}>Start Game</Button>}
            </div>

            {Object.keys(games).length === 0 ?
                <div className={"flex-row"}>
                    <div className={"flex flex-col"}>
                        {roomies.map((user) => {
                            return(
                                <div key={user.id} className='w-24 h-24 mt-10 truncate'><UserTag userColors={userColors} name={user.name}/>
                                    <img className={'w-12 h-12'} src={user.image} />
                                </div>)})
                        }
                        {Array.from({length: 5-roomies.length}, (v,k)=>k+1).map((idx) => (
                            <div key={idx}><ShareLink roomId={roomId}></ShareLink>
                            </div>
                        ))}
                    </div>
                </div>
                :
                <div className={'flex flex-col mt-10'}>
                    {Object.entries(games).map((game, idx) => (
                        <div key={idx}>
                            <GamePanels userColors={userColors} userId={userId} gameId={game[0]}/>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}

function UserTag({userColors, name}:{userColors:{[name:string]: string }, name:string}) {
    return (<span className={userColors[name]}><strong>{name}</strong></span> )
}