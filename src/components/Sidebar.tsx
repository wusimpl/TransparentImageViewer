import { Folder, Clock, X, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import clsx from 'clsx';

export const Sidebar = () => {
    const { favoriteDirectories, currentDirectoryHandle, removeFavoriteDirectory } = useAppStore();

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
            <div className="h-12 px-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-blue-400" />
                    Library
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                        Opened Folders
                    </h3>
                    <div className="space-y-1">
                        {favoriteDirectories.map((dir) => (
                            <div
                                key={dir.name}
                                className={clsx(
                                    "group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors",
                                    currentDirectoryHandle?.name === dir.name
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                                onClick={() => window.dispatchEvent(new CustomEvent('OPEN_HISTORY', { detail: dir.handle }))}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate text-sm">{dir.name}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFavoriteDirectory(dir.name);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {favoriteDirectories.length === 0 && (
                            <div className="text-sm text-gray-600 px-2 py-4 text-center">
                                No opened folders
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => window.dispatchEvent(new Event('OPEN_PICKER'))}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Open Folder
                </button>
            </div>
        </div>
    );
};
