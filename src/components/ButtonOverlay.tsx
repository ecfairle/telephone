import * as React from "react";
import {ReactNode, useRef, useState} from "react";
import {Overlay} from "@restart/ui";
import {Button, ButtonProps} from "@/components/button";
import {clsx} from "clsx";

interface ButtonOverlayProps extends ButtonProps {
    // other props
    children?: ReactNode;
    overlayText?: string;
    tooltipText?: string;
    onClick?: () => void;
    className?: string;
}

export default function ButtonOverlay({children, overlayText, tooltipText, ...props}: ButtonOverlayProps) {
        const [show, setShow] = useState(false);
        const [showTooltip, setShowTooltip] = useState(tooltipText !== undefined);
        const triggerRef = useRef(null);
        const containerRef = useRef(null);
        return (
            <div ref={containerRef}>
                <Button
                    {...props}
                    ref={triggerRef}
                    onClick={() => {
                        setShow(overlayText!==undefined);
                        setShowTooltip(false);
                        setTimeout(() => {setShow(false);}, 2000);
                        if (props.onClick) {
                            props.onClick();
                        }
                    }}
                >{children}</Button>
                    <Overlay
                        show={show || showTooltip}
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
                                                "before:absolute before:rotate-45 before:bg-blue-500 before:top-0 before:left-0 before:w-3 before:h-3",
                                            )}
                                        />
                                        <div className="py-1 px-2 text-center rounded bg-blue-500 text-white ">
                                            {showTooltip? tooltipText : overlayText}
                                        </div>
                                </div>
                            )}
                    </Overlay>
            </div>
        )
}