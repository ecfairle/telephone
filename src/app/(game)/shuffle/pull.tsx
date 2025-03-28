"use client";

import {Button} from "@/components/button";
import {pullShuffle} from "@/lib/api";
import {useRouter} from "next/navigation";

export default function Pull() {
    const router = useRouter();
    return (
        <Button variant={'blue'} size={'lg'} onClick={async () => {
            await pullShuffle();
            router.refresh();
        }}>Play!</Button>
    )
}