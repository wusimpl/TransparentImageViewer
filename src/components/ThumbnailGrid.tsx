import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FileSystemFile, FileSystemFolder } from '../hooks/useFileSystem';
import { Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FolderItem } from './FolderItem';

interface ThumbnailGridProps {
    folders: FileSystemFolder[];
    onFolderClick: (folder: FileSystemFolder) => void;
    onImageClick: (file: FileSystemFile) => void;
    selectedFile: FileSystemFile | null;
    thumbnailSize: number;
}

const ThumbnailItem = ({ file, onClick, isSelected }: { file: FileSystemFile; onClick: () => void; isSelected: boolean }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        const element = document.getElementById(`thumb-${file.name}`);
        if (element) {
            observer.observe(element);
        }

        return () => observer.disconnect();
    }, [file.name]);

    useEffect(() => {
        if (isVisible && !src) {
            file.handle.getFile().then(f => {
                const url = URL.createObjectURL(f);
                setSrc(url);
            });
        }
        return () => {
            // Cleanup URL if needed
        };
    }, [isVisible, file, src]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            id={`thumb-${file.name}`}
            className={clsx(
                "group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer border transition-all duration-200",
                isSelected ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 z-10" : "border-gray-700 hover:border-blue-500"
            )}
            onClick={onClick}
        >
            {src ? (
                <div className="w-full h-full relative">
                    {/* Checkerboard background for transparency */}
                    <div className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    />
                    <img
                        src={src}
                        alt={file.name}
                        className="w-full h-full object-contain relative z-10 p-2 transition-transform group-hover:scale-110"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <ImageIcon className="w-8 h-8" />
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 translate-y-full group-hover:translate-y-0 transition-transform z-20">
                <p className="text-xs text-white truncate text-center">{file.name}</p>
            </div>
        </motion.div>
    );
};

export const ThumbnailGrid = ({ folders, onFolderClick, onImageClick, selectedFile, thumbnailSize }: ThumbnailGridProps) => {
    const { files, isLoading } = useAppStore();

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                Loading files...
            </div>
        );
    }

    if (files.length === 0 && folders.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">请打开一个图片文件夹</p>
                <p className="text-sm mt-2 opacity-70"></p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))` }}
            >
                {folders.map((folder) => (
                    <FolderItem
                        key={folder.name}
                        folder={folder}
                        onClick={() => onFolderClick(folder)}
                    />
                ))}
                {files.map((file) => {
                    const isSelected = selectedFile?.name === file.name;
                    return (
                        <ThumbnailItem
                            key={file.name}
                            file={file}
                            onClick={() => onImageClick(file)}
                            isSelected={isSelected}
                        />
                    );
                })}
            </div>
        </div>
    );
};
