import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { PreviewPanel } from './components/PreviewPanel';
import { useAppStore } from './store/useAppStore';
import { useFileSystem, FileSystemFile, FileSystemFolder } from './hooks/useFileSystem';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ChevronLeft, Grid3X3, Grid, Square } from 'lucide-react';

function App() {
    const {
        setCurrentDirectory,
        loadFavoriteDirectories,
        addFavoriteDirectory,
        toggleFavorite,
        favoriteDirectories,
        setLoading,
        files: storeFiles
    } = useAppStore();

    const {
        openDirectory,
        openDirectoryWithHandle,
        loadFilesFromDirectory,
        navigateToDirectory,
        navigateUp,
        canNavigateUp,
        files: hookFiles,
        folders: hookFolders,
        isLoading: hookLoading,
        currentDirectoryHandle,
        path
    } = useFileSystem();

    // Sync hook state with store
    useEffect(() => {
        setLoading(hookLoading);
    }, [hookLoading, setLoading]);

    const [selectedFile, setSelectedFile] = useState<FileSystemFile | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewWidth, setPreviewWidth] = useState(400);
    const [thumbnailSize, setThumbnailSize] = useState(() => {
        const saved = localStorage.getItem('thumbnailSize');
        return saved ? parseInt(saved, 10) : 200;
    });

    useEffect(() => {
        localStorage.setItem('thumbnailSize', thumbnailSize.toString());
    }, [thumbnailSize]);

    useEffect(() => {
        if (currentDirectoryHandle) {
            setCurrentDirectory(currentDirectoryHandle, hookFiles);
        }
    }, [currentDirectoryHandle, hookFiles, setCurrentDirectory]);

    // Load favorites on mount
    useEffect(() => {
        loadFavoriteDirectories();
    }, [loadFavoriteDirectories]);

    // Event listeners for Sidebar actions
    useEffect(() => {
        const handleOpenPicker = async () => {
            const handle = await openDirectory();
            if (handle) {
                await addFavoriteDirectory(handle);
            }
        };

        const handleOpenHistory = async (e: Event) => {
            const handle = (e as CustomEvent<FileSystemDirectoryHandle>).detail;
            await openDirectoryWithHandle(handle);
        };

        window.addEventListener('OPEN_PICKER', handleOpenPicker);
        window.addEventListener('OPEN_HISTORY', handleOpenHistory);

        return () => {
            window.removeEventListener('OPEN_PICKER', handleOpenPicker);
            window.removeEventListener('OPEN_HISTORY', handleOpenHistory);
        };
    }, [openDirectory, loadFilesFromDirectory, openDirectoryWithHandle]);

    const handleNext = () => {
        if (!selectedFile) return;
        const idx = storeFiles.findIndex(f => f.name === selectedFile.name);
        if (idx < storeFiles.length - 1) {
            setSelectedFile(storeFiles[idx + 1]);
        }
    };

    const handlePrev = () => {
        if (!selectedFile) return;
        const idx = storeFiles.findIndex(f => f.name === selectedFile.name);
        if (idx > 0) {
            setSelectedFile(storeFiles[idx - 1]);
        }
    };

    const handleImageClick = (file: FileSystemFile) => {
        if (selectedFile?.name === file.name) {
            // If clicking same file, just ensure preview is open
            setIsPreviewOpen(true);
        } else {
            setSelectedFile(file);
            setIsPreviewOpen(true);
        }
    };

    const handleFolderClick = async (folder: FileSystemFolder) => {
        await navigateToDirectory(folder);
    };

    const handleBreadcrumbNavigate = async (handle: FileSystemDirectoryHandle, index: number) => {
        // If clicking the last item, do nothing (already handled in component but good for safety)
        if (index === path.length - 1) return;

        // When clicking a breadcrumb, we're jumping to a parent directory
        // Reset the stack to avoid incorrect path accumulation
        await navigateToDirectory({ name: handle.name, handle }, true);
    };

    return (
        <Layout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Top Bar: Navigation & Breadcrumbs */}
                <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0 gap-4">
                    {canNavigateUp && (
                        <button
                            onClick={navigateUp}
                            className="flex items-center text-gray-300 hover:text-white text-sm shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </button>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <Breadcrumbs
                            path={path.map(h => ({ name: h.name, handle: h }))}
                            onNavigate={handleBreadcrumbNavigate}
                            isFavorite={currentDirectoryHandle ? favoriteDirectories.some(d => d.name === currentDirectoryHandle.name) : false}
                            onToggleFavorite={currentDirectoryHandle ? () => toggleFavorite(currentDirectoryHandle) : undefined}
                        />
                    </div>

                    {/* Thumbnail Size Controls */}
                    <div className="flex items-center bg-gray-700 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setThumbnailSize(120)}
                            className={`p-1.5 rounded-md transition-colors ${thumbnailSize === 120 ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'}`}
                            title="Small thumbnails"
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setThumbnailSize(200)}
                            className={`p-1.5 rounded-md transition-colors ${thumbnailSize === 200 ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'}`}
                            title="Medium thumbnails"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setThumbnailSize(280)}
                            className={`p-1.5 rounded-md transition-colors ${thumbnailSize === 280 ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50'}`}
                            title="Large thumbnails"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-row">
                    {/* Left: Thumbnails */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <ThumbnailGrid
                            folders={hookFolders}
                            onFolderClick={handleFolderClick}
                            onImageClick={handleImageClick}
                            selectedFile={selectedFile}
                            thumbnailSize={thumbnailSize}
                        />
                    </div>

                    {/* Right: Preview Panel */}
                    {isPreviewOpen && (
                        <>
                            {/* Resizer Handle */}
                            <div
                                className="w-1 bg-gray-800 hover:bg-blue-500 cursor-col-resize transition-colors shrink-0 z-10"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    const startX = e.clientX;
                                    const startWidth = previewWidth;

                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                        const delta = startX - moveEvent.clientX;
                                        const newWidth = Math.min(Math.max(300, startWidth + delta), 800);
                                        setPreviewWidth(newWidth);
                                    };

                                    const handleMouseUp = () => {
                                        document.removeEventListener('mousemove', handleMouseMove);
                                        document.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                }}
                            />
                            <div
                                className="shrink-0 border-l border-gray-700 bg-gray-900"
                                style={{ width: previewWidth }}
                            >
                                <PreviewPanel
                                    file={selectedFile}
                                    onClose={() => {
                                        setIsPreviewOpen(false);
                                        setSelectedFile(null);
                                    }}
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default App;
