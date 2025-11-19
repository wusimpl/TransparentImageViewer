import React, { useEffect, useState, useRef } from 'react';
import { FileSystemFile } from '../hooks/useFileSystem';
import { analyzeImage, ImageAnalysisResult } from '../utils/colorAnalysis';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Sun, Moon, Grid, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

interface PreviewPanelProps {
    file: FileSystemFile | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export const PreviewPanel = ({ file, onClose, onNext, onPrev, folderPath = '' }: PreviewPanelProps & { folderPath?: string }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
    // Load saved scale from localStorage, default to 1
    const [scale, setScale] = useState(() => {
        const saved = localStorage.getItem('previewScale');
        return saved ? parseFloat(saved) : 1;
    });
    const [bgMode, setBgMode] = useState<'auto' | 'dark' | 'light' | 'checkerboard'>('auto');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [meta, setMeta] = useState<{ width: number; height: number; size: number } | null>(null);

    // Persist scale to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('previewScale', scale.toString());
    }, [scale]);

    useEffect(() => {
        if (!file) {
            setSrc(null);
            setMeta(null);
            setAnalysis(null);
            return;
        }

        let active = true;
        const load = async () => {
            try {
                const f = await file.handle.getFile();
                const url = URL.createObjectURL(f);
                if (active) {
                    setSrc(url);
                    setMeta(prev => ({ ...prev!, size: f.size, width: 0, height: 0 })); // Init size

                    // Load image to get dimensions
                    const img = new Image();
                    img.onload = () => {
                        if (active) {
                            setMeta(prev => ({ ...prev!, width: img.naturalWidth, height: img.naturalHeight }));
                        }
                    };
                    img.src = url;

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

        // Reset position on file change (but keep scale for persistence)
        setPosition({ x: 0, y: 0 });
        setAnalysis(null);
        setMeta(null);

        return () => {
            active = false;
            if (src) URL.revokeObjectURL(src);
        };
    }, [file]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle navigation if we have a file
            if (!file) {
                if (e.key === 'Escape') onClose();
                return;
            }

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
                    backgroundColor: '#2a2a2a',
                    backgroundImage: `
                        linear-gradient(45deg, #333 25%, transparent 25%), 
                        linear-gradient(-45deg, #333 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #333 75%), 
                        linear-gradient(-45deg, transparent 75%, #333 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
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

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!file) {
        return (
            <div className="w-full h-full flex flex-col bg-gray-900 border-t border-gray-700">
                <div className="h-10 flex items-center justify-end px-3 border-b border-gray-800 bg-gray-800/50 shrink-0">
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                    <ImageIcon className="w-16 h-16 opacity-20" />
                    <p>Select an image to preview</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-900 border-t border-gray-700">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-3 border-b border-gray-800 bg-gray-800/50 shrink-0">
                <div className="text-white font-medium truncate text-sm flex-1 mr-2" title={file.name}>
                    {file.name}
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-800">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-2 border-b border-gray-800 bg-gray-800/30 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    {/* Background Controls */}
                    <div className="flex items-center bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setBgMode('auto')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'auto' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Auto Background"
                        >
                            <span className="text-xs font-bold px-0.5">A</span>
                        </button>
                        <button
                            onClick={() => setBgMode('checkerboard')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'checkerboard' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Grid"
                        >
                            <Grid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setBgMode('light')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'light' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Light"
                        >
                            <Sun className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setBgMode('dark')}
                            className={clsx("p-1.5 rounded transition-colors", bgMode === 'dark' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            title="Dark"
                        >
                            <Moon className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        {/* Quick Zoom Buttons */}
                        <div className="flex items-center bg-gray-800 rounded-lg p-1 gap-0.5">
                            {[0.5, 1, 1.5, 2].map((zoomLevel) => (
                                <button
                                    key={zoomLevel}
                                    onClick={() => setScale(zoomLevel)}
                                    className={clsx(
                                        "px-2 py-1 rounded text-xs font-medium transition-colors",
                                        scale === zoomLevel
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-400 hover:text-white hover:bg-gray-700"
                                    )}
                                    title={`${zoomLevel * 100}%`}
                                >
                                    {zoomLevel * 100}%
                                </button>
                            ))}
                        </div>

                        {/* Zoom In/Out Controls */}
                        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-gray-400 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
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
                                maxHeight: 'none',
                                maxWidth: 'none',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div className="p-4 border-t border-gray-800 bg-gray-800/30 shrink-0">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Image Details</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Dimensions</span>
                        <span className="text-gray-200 font-mono">{meta?.width || '-'} x {meta?.height || '-'} px</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Size</span>
                        <span className="text-gray-200 font-mono">{meta ? formatSize(meta.size) : '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                        <span className="text-gray-400">Path</span>
                        <span className="text-gray-200 font-mono text-xs break-all bg-gray-800 p-1.5 rounded border border-gray-700">
                            {folderPath ? `${folderPath}/${file.name}` : file.name}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
