import React, { useEffect, useState, useRef } from 'react';
import { FileSystemFile } from '../hooks/useFileSystem';
import { analyzeImage, ImageAnalysisResult } from '../utils/colorAnalysis';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sun, Moon, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ImageViewerProps {
    file: FileSystemFile;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export const InlineImageViewer = ({ file, onClose, onNext, onPrev }: ImageViewerProps) => {
    const [src, setSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
    const [scale, setScale] = useState(1);
    const [bgMode, setBgMode] = useState<'auto' | 'dark' | 'light' | 'checkerboard'>('auto');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const f = await file.handle.getFile();
                const url = URL.createObjectURL(f);
                if (active) {
                    setSrc(url);
                    // Analyze image
                    analyzeImage(url).then(res => {
                        if (active) setAnalysis(res);
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };
        load();

        // Reset state on file change
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setAnalysis(null);

        return () => {
            active = false;
            if (src) URL.revokeObjectURL(src);
        };
    }, [file]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    const getBgStyle = () => {
        const mode = bgMode === 'auto' ? analysis?.suggestedBackground || 'checkerboard' : bgMode;

        switch (mode) {
            case 'dark': return { backgroundColor: '#1a1a1a' };
            case 'light': return { backgroundColor: '#f0f0f0' };
            case 'checkerboard':
            default:
                return {
                    backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#2a2a2a'
                };
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY * -0.001;
        setScale(s => Math.min(Math.max(0.1, s + delta), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '600px' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full bg-gray-900 border-y border-gray-700 overflow-hidden flex flex-col"
        >
            {/* Toolbar */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-800/50 z-10">
                <div className="text-white font-medium truncate max-w-md flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Preview:</span>
                    {file.name}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-800 rounded-lg p-1 mr-4">
                        <button
                            onClick={() => setBgMode('auto')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'auto' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Auto Background"
                        >
                            A
                        </button>
                        <button
                            onClick={() => setBgMode('checkerboard')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'checkerboard' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Grid"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setBgMode('light')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'light' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Light"
                        >
                            <Sun className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setBgMode('dark')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'dark' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Dark"
                        >
                            <Moon className="w-4 h-4" />
                        </button>
                    </div>

                    <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 text-gray-400 hover:text-white">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-gray-400 text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-2 text-gray-400 hover:text-white">
                        <ZoomIn className="w-5 h-5" />
                    </button>

                    <div className="w-px h-6 bg-gray-700 mx-2" />

                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div
                className="flex-1 relative overflow-hidden flex items-center justify-center select-none bg-gray-900"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Navigation Arrows */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-40 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-40 transition-colors"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Container */}
                {src && (
                    <div
                        className="transition-transform duration-75 ease-out"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            ...getBgStyle()
                        }}
                    >
                        <img
                            src={src}
                            alt={file.name}
                            className="max-w-none pointer-events-none shadow-2xl"
                            style={{
                                maxHeight: scale === 1 ? '500px' : 'none', // Limit height in inline view
                                maxWidth: scale === 1 ? '100%' : 'none',
                            }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};
