import * as React from "react";
import {ReactNode, useRef, useState} from "react";
import {Overlay} from "@restart/ui";
import {Button} from "@/components/button";
import {clsx} from "clsx";

interface ButtonOverlayProps {
    // other props
    children?: ReactNode;
    overlayText?: string;
    onClick?: () => void;
    className?: string;
}

export default function ButtonOverlay({children, overlayText, ...props}: ButtonOverlayProps) {
        const [show, setShow] = useState(false);
        const triggerRef = useRef(null);
        const containerRef = useRef(null);
        return (
            <div ref={containerRef}>
                <Button
                    {...props}
                    ref={triggerRef}
                    onClick={() => {
                        setShow(true);
                        setTimeout(() => {setShow(false);}, 2000);
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                >{children}</Button>
                    <Overlay
                        show={show}
                        rootClose
                        offset={[0, 10]}
                        placement={'right'}
                        container={containerRef}
                        target={triggerRef}
                    >
                            {(props, { arrowProps }) => (
                                <div {...props} className="absolute">
                                        <div
                                            {...arrowProps}
                                            style={arrowProps.style}
                                            className={clsx(
                                                "absolute w-3 h-3 z-[-1]",
                                                "before:absolute before:rotate-45 before:bg-black before:top-0 before:left-0 before:w-3 before:h-3",
                                            )}
                                        />
                                        <div className="py-1 px-2 text-center rounded bg-black text-white ">
                                            {overlayText}
                                        </div>
                                </div>
                            )}
                    </Overlay>
            </div>
        )
}