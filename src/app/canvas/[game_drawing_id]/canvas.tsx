'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { OpenableComponent } from '@/lib/utils'
import {
    ReactSketchCanvas,
    type ReactSketchCanvasRef
} from 'react-sketch-canvas'

import { Button } from '@/components/button'
import { Eraser, Pen, Redo, RotateCcw, Save, Undo, Circle } from 'lucide-react'
import { saveImageToGCS } from '@/lib/utils'

export default function Canvas({secretWord, gameDrawingId}) {
    const colorInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<ReactSketchCanvasRef>(null)
    const [strokeColor, setStrokeColor] = useState('#a855f7')
    const [strokeWidth, setStrokeWidth] = useState(4)
    const [eraseMode, setEraseMode] = useState(false)
    const [word, setSecretWord] = useState(secretWord);
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
        const response = await saveImageToGCS(dataURL, `${gameDrawingId}.png`);
        setSecretWord(await response.json());
    }

    return (
        <section className='py-24'>
            <div className='container'>
                <h1 className='text-3xl font-bold justify-center'>{word}</h1>
                <div className='mt-6 flex max-w-2xl gap-4'>
                    <ReactSketchCanvas
                        width='100%'
                        height='430px'
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
                            onClick={() => setDisplaySizeSelector(true)}
                        >

                            <Circle size={strokeWidth * 10}/>

                        </Button>
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
                        </OpenableComponent>
                        {/*{displaySizeSelector ?*/}
                        {/*    <OpenableComponent setOpen={setDisplaySizeSelector}>*/}
                        {/*        <input*/}
                        {/*            type='range'*/}
                        {/*            min={4}*/}
                        {/*            max={14}*/}
                        {/*            value={strokeWidth}*/}
                        {/*                onChange={handleStrokeWidthChange}*/}
                        {/*            />*/}
                        {/*        </OpenableComponent>*/}
                        {/*        : null*/}
                        {/*    }*/}

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
