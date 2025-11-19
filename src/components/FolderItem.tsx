import { Folder } from 'lucide-react';
import { FileSystemFolder } from '../hooks/useFileSystem';

interface FolderItemProps {
    folder: FileSystemFolder;
    onClick: () => void;
}

export const FolderItem = ({ folder, onClick }: FolderItemProps) => {
    return (
        <div
            className="group relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-blue-500 transition-all duration-200 flex flex-col items-center justify-center"
            onClick={onClick}
        >
            <Folder className="w-16 h-16 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 w-full">
                <p className="text-xs text-white truncate text-center">{folder.name}</p>
            </div>
        </div>
    );
};
