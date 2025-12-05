import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../icons';

interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onCropComplete: (croppedImage: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, imageUrl, onCropComplete }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (isOpen && imageUrl) {
            const img = new Image();
            img.onload = () => {
                imgRef.current = img;
                const containerWidth = containerRef.current?.clientWidth || 400;
                const containerHeight = containerRef.current?.clientHeight || 400;

                const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
                const displayWidth = img.width * scale;
                const displayHeight = img.height * scale;

                setImageSize({ width: displayWidth, height: displayHeight });
                setPosition({ x: 0, y: 0 });
                setZoom(1);
            };
            img.src = imageUrl;
        }
    }, [isOpen, imageUrl]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        const containerWidth = containerRef.current?.clientWidth || 400;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const selectorSize = Math.min(containerWidth, containerHeight);

        const scaledWidth = imageSize.width * zoom;
        const scaledHeight = imageSize.height * zoom;

        const maxX = (scaledWidth - selectorSize) / 2;
        const maxY = (scaledHeight - selectorSize) / 2;

        setPosition({
            x: Math.max(-maxX, Math.min(maxX, newX)),
            y: Math.max(-maxY, Math.min(maxY, newY))
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);

        const containerWidth = containerRef.current?.clientWidth || 400;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const selectorSize = Math.min(containerWidth, containerHeight);

        const scaledWidth = imageSize.width * newZoom;
        const scaledHeight = imageSize.height * newZoom;

        const maxX = (scaledWidth - selectorSize) / 2;
        const maxY = (scaledHeight - selectorSize) / 2;

        setPosition({
            x: Math.max(-maxX, Math.min(maxX, position.x)),
            y: Math.max(-maxY, Math.min(maxY, position.y))
        });
    };

    const handleSave = () => {
        if (!imgRef.current || !canvasRef.current) return;

        const containerWidth = containerRef.current?.clientWidth || 400;
        const containerHeight = containerRef.current?.clientHeight || 400;
        const selectorSize = Math.min(containerWidth, containerHeight);

        const outputSize = 512;
        canvasRef.current.width = outputSize;
        canvasRef.current.height = outputSize;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const scaledWidth = imageSize.width * zoom;
        const scaledHeight = imageSize.height * zoom;

        const sourceX = (scaledWidth / 2 - position.x - selectorSize / 2) / zoom / (imageSize.width / imgRef.current.width);
        const sourceY = (scaledHeight / 2 - position.y - selectorSize / 2) / zoom / (imageSize.height / imgRef.current.height);
        const sourceSize = selectorSize / zoom / (imageSize.width / imgRef.current.width);

        ctx.drawImage(
            imgRef.current,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            outputSize,
            outputSize
        );

        const croppedImage = canvasRef.current.toDataURL('image/png');
        onCropComplete(croppedImage);
        onClose();
    };

    if (!isOpen) return null;

    const containerWidth = containerRef.current?.clientWidth || 400;
    const containerHeight = containerRef.current?.clientHeight || 400;
    const selectorSize = Math.min(containerWidth, containerHeight);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl border border-border-color" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Crop Profile Picture</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div
                        ref={containerRef}
                        className="relative w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {imageUrl && imageSize.width > 0 && (
                            <>
                                <div
                                    className="absolute top-1/2 left-1/2"
                                    style={{
                                        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        width: `${imageSize.width}px`,
                                        height: `${imageSize.height}px`,
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'contain',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                    }}
                                />

                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-black/50" />
                                    <div
                                        className="absolute top-1/2 left-1/2 border-2 border-white shadow-lg"
                                        style={{
                                            width: `${selectorSize}px`,
                                            height: `${selectorSize}px`,
                                            transform: 'translate(-50%, -50%)',
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Zoom</label>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>1x</span>
                            <span>2x</span>
                            <span>3x</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-color flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                        Save
                    </button>
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};
