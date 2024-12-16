"use client";
import {GameDrawing} from "@/lib/data_definitions";
import {useRouter} from "next/navigation";


export default function Guess({gameDrawing, imageUrl} : {gameDrawing: GameDrawing, imageUrl: string}) {
    const router = useRouter();
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form as HTMLFormElement);
        fetch(`/save_guess/${gameDrawing.id}`, {
            method: 'POST',
                headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_drawing_id: gameDrawing.id,
                guess: formData.get("guess")
            })

        })
        router.push("/");
    }

    return (
            <div>
                <form method="post" onSubmit={handleSubmit}>
                    <label>Guess: <input name="guess"/></label>
                    <button type="submit">Submit</button>
                </form>
                <img alt='drawing' src={`${imageUrl}`}/>
            </div>
        )
}