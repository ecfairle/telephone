import {fetchAvailableDrawings, fetchGames} from '@/lib/data';
import Link from 'next/link';
import {getSignedUrl} from "@/lib/gcs";
import {GameDrawing} from "@/lib/data_definitions";

export default async function Home() {
  // const params = await searchParams;
  const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
  const games = await fetchGames(userId);
  const drawings = await fetchAvailableDrawings(userId);
  const gameDrawings = drawings.reduce((prev, cur) => {
    if (cur.game_id in prev) {
      return {...prev, [cur.game_id]: [...prev[cur.game_id], cur]};
    } else {
      return {...prev, [cur.game_id]: [cur]}
    }
  }, {})
  console.log(gameDrawings)

  console.log(games);
  return (<div className={"container"}>
    {Object.values(games).map((game, idx) => (
        <div><li key={idx}>{"Game with " + game.reduce((csl, cur) => csl + ", " + cur.name,
            "")}</li> <ListGame userId={userId} drawings={gameDrawings[Object.keys(games)[idx]]}/></div>
    ))}
      </div>)
}

async function ListGame ({drawings, userId} : {drawings: GameDrawing[], userId: string}) {
  const pastDrawings = drawings.filter(drawing => drawing.drawer_id !== null);
  const curDrawings = drawings.filter(drawing =>
      (drawing.drawer_id === null || drawing.drawer_id === userId) &&
      drawing.drawing_done === false && drawing.target_word !== null);
  const curGuessable = drawings.filter(drawing => drawing.target_word === null);

  return (<div>
      <p> {curDrawings.length > 0 ?
          <Link
              href={{
                pathname: `/canvas/${curDrawings[0].id}`}}
          > {"Start drawing your word "}</Link> : "NO WORDS"}</p>
  {curGuessable.length > 0 ?
      <Link href={{pathname: `/guess/${curGuessable[0].id}`}}><p>{`Guess drawing for game ${curGuessable[0].game_id}`}</p></Link> : null}
  {pastDrawings.length > 0 ?
      <div><p>{`You drew \"${pastDrawings[pastDrawings.length - 1].target_word}\"`}</p><img alt='past drawing' src={`${await getSignedUrl(pastDrawings[pastDrawings.length - 1].id)}`}/></div> : "no old games"}
      </div>
    )
}