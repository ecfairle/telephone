import {fetchAvailableDrawings, fetchGames} from '@/lib/data';
import Link from 'next/link';
import {getSignedUrl} from "@/lib/gcs";

export default async function Home() {
  // const params = await searchParams;
  const userId = '410544b2-4001-4271-9855-fec4b6a6442a';
  const games = await fetchGames(userId);
  const drawings = await fetchAvailableDrawings(userId);
  console.log(drawings)

  console.log(games);
  const pastDrawings = drawings.filter(drawing => drawing.drawer_id !== null);
  const curDrawings = drawings.filter(drawing =>
      (drawing.drawer_id === null || drawing.drawer_id === userId) &&
      drawing.drawing_done === false && drawing.target_word !== null);
  const curGuessable = drawings.filter(drawing => drawing.target_word === null);
  return (<div className={"container"}>
    <p> {curDrawings.length > 0 ?
        <Link
            href={{
              pathname: `/canvas/${curDrawings[0].id}`}}
        > {"Start drawing your word "}</Link> : "NO WORDS"}</p>
    {curGuessable.length > 0 ?
    <Link href={{pathname: `/guess/${curGuessable[0].id}`}}><p>{`Guess drawing for game ${curGuessable[0].game_id}`}</p></Link> : null}
    {pastDrawings.length > 0 ?
        <div><p>{`You drew \"${pastDrawings[pastDrawings.length - 1].target_word}\"`}</p><img alt='past drawing' src={`${await getSignedUrl(pastDrawings[pastDrawings.length - 1].id)}`}/></div> : "no old games"}
      </div>)
    }
