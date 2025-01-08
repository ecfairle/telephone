'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { OpenableComponent } from '@/components/modal'
import {
    ReactSketchCanvas,
    type ReactSketchCanvasRef
} from 'react-sketch-canvas'

import { Button } from '@/components/button'
import { Eraser, Pen, Redo, RotateCcw, Save, Undo, Circle } from 'lucide-react'
import { uploadImage } from '@/lib/api'
import { useRouter } from 'next/navigation'
import {useSession} from "next-auth/react";


export default function Canvas({secretWord, gameDrawingId} : {secretWord:string, gameDrawingId:string}) {
    const router = useRouter();
    const session = useSession();
    if (!session) {
        router.push('/login');
    }
    console.log('user id' + session?.data?.user?.id)
    const colorInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<ReactSketchCanvasRef>(null)
    const [strokeColor, setStrokeColor] = useState('#4fab50')
    const [strokeWidth, setStrokeWidth] = useState(4)
    const [eraseMode, setEraseMode] = useState(false)
    const [word] = useState(secretWord);
    const [displaySizeSelector, setDisplaySizeSelector] = useState(false);

    function handleStrokeColorChange(event: ChangeEvent<HTMLInputElement>) {
        setStrokeColor(event.target.value)
        console.log(strokeColor)
    }

    function handleEraserClick() {
        setEraseMode(true)
        canvasRef.current?.eraseMode(true)
    }

    function handlePenClick() {
        setEraseMode(false)
        canvasRef.current?.eraseMode(false)
    }

    function handleUndoClick() {
        canvasRef.current?.undo()
    }

    function handleRedoClick() {
        canvasRef.current?.redo()
    }

    function handleClearClick() {
        canvasRef.current?.clearCanvas()
    }

    async function handleSave() {
        const dataURL = await canvasRef.current?.exportImage('png');
        if (!dataURL) {
            console.log('failed to export canvas');
            return;
        }
        await uploadImage(dataURL, `${gameDrawingId}.png`, gameDrawingId);

        router.push(`/`);
    }

    return (
        <section className='py-24'>
            <div className='container mx-auto max-w-fit'>
                <div className='text-3xl justify-center text-center'>{"draw: " + word}</div>
                <div className='mt-6 flex max-w-2xl gap-4'>
                    <ReactSketchCanvas
                        width='2000px'
                        height='500px'
                        ref={canvasRef}
                        strokeColor={strokeColor}
                        strokeWidth={strokeWidth}
                        canvasColor='transparent'
                        className='!rounded-2xl !border-purple-500 dark:!border-purple-800'
                    />

                    <div
                        className='flex flex-col items-center gap-y-6 divide-y divide-purple-200 py-4 dark:divide-purple-900'>
                        {/* Color picker */}
                        <Button
                            size='icon'
                            type='button'
                            onClick={() => colorInputRef.current?.click()}
                            style={{backgroundColor: strokeColor}}
                        >
                            <input
                                type='color'
                                ref={colorInputRef}
                                className='sr-only'
                                value={strokeColor}
                                onChange={handleStrokeColorChange}
                            />
                        </Button>
                        {/* Size scroller */}
                        <Button
                            size='icon'
                            type='button'
                            onMouseDown={() => setDisplaySizeSelector(true)}
                        >

                            <Circle size={strokeWidth}/>

                        </Button>
                        {displaySizeSelector?
                        <OpenableComponent setOpen={setDisplaySizeSelector}>
                            <dialog open={displaySizeSelector}>
                                <Button
                                    size='icon'
                                    type='button'
                                    variant='outline'
                                    onClick={() => {
                                        setStrokeWidth(4);
                                        setDisplaySizeSelector(false);
                                    }}
                                >
                                    <Circle size={4}/>
                                </Button>
                                <Button
                                    size='icon'
                                    type='button'
                                    variant='outline'
                                    onClick={() => {
                                        setStrokeWidth(8);
                                        setDisplaySizeSelector(false);
                                    }}
                                >
                                    <Circle size={8}/>
                                </Button>
                                <Button
                                    size='icon'
                                    type='button'
                                    variant='outline'
                                    onClick={() => {
                                        setStrokeWidth(12);
                                        setDisplaySizeSelector(false);
                                    }}
                                >
                                    <Circle size={12}/>
                                </Button>
                            </dialog>
                        </OpenableComponent> : null}
                        {/* Drawing mode */}
                        <div className='flex flex-col gap-3 pt-6'>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                disabled={!eraseMode}
                                onClick={handlePenClick}
                            >
                                <Pen size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                disabled={eraseMode}
                                onClick={handleEraserClick}
                            >
                                <Eraser size={16}/>
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className='flex flex-col gap-3 pt-6'>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleUndoClick}
                            >
                                <Undo size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleRedoClick}
                            >
                                <Redo size={16}/>
                            </Button>
                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleClearClick}
                            >
                                <RotateCcw size={16}/>
                            </Button>

                            <Button
                                size='icon'
                                type='button'
                                variant='outline'
                                onClick={handleSave}
                            >
                                <Save size={16}/>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
