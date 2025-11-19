import React from 'react';
import { ChevronRight, Home, Star } from 'lucide-react';

interface BreadcrumbItem {
    name: string;
    handle: FileSystemDirectoryHandle;
}

interface BreadcrumbsProps {
    path: BreadcrumbItem[];
    onNavigate: (handle: FileSystemDirectoryHandle, index: number) => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

export const Breadcrumbs = ({ path, onNavigate, isFavorite, onToggleFavorite }: BreadcrumbsProps) => {
    if (path.length === 0) return null;

    return (
        <div className="flex items-center gap-1 text-sm text-gray-400 overflow-x-auto whitespace-nowrap p-2 scrollbar-hide">
            <button
                onClick={() => onNavigate(path[0].handle, 0)}
                className="hover:text-white flex items-center transition-colors"
            >
                <Home className="w-4 h-4" />
            </button>

            {path.map((item, index) => {
                const isLast = index === path.length - 1;

                return (
                    <React.Fragment key={index}>
                        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                        <button
                            onClick={() => !isLast && onNavigate(item.handle, index)}
                            disabled={isLast}
                            className={`hover:text-white transition-colors ${isLast ? 'text-white font-medium cursor-default' : 'cursor-pointer'}`}
                        >
                            {item.name}
                        </button>
                    </React.Fragment>
                );
            })}

            {onToggleFavorite && (
                <button
                    onClick={onToggleFavorite}
                    className={`ml-4 p-1 rounded hover:bg-gray-700 transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star className="w-4 h-4 fill-current" />
                </button>
            )}
        </div>
    );
};
