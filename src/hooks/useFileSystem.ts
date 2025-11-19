import { useState, useCallback } from 'react';


export interface FileSystemFile {
    name: string;
    handle: FileSystemFileHandle;
    url?: string;
    type: 'image' | 'other';
}

export interface FileSystemFolder {
    name: string;
    handle: FileSystemDirectoryHandle;
}

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif', 'bmp'];

export const useFileSystem = () => {
    const [currentDirectoryHandle, setCurrentDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    // Stack to keep track of directory history for "go up" functionality
    const [directoryStack, setDirectoryStack] = useState<FileSystemDirectoryHandle[]>([]);

    const [files, setFiles] = useState<FileSystemFile[]>([]);
    const [folders, setFolders] = useState<FileSystemFolder[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFilesFromDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
        setIsLoading(true);
        setError(null);
        const newFiles: FileSystemFile[] = [];
        const newFolders: FileSystemFolder[] = [];

        try {
            // Verify permission
            const permission = await handle.queryPermission({ mode: 'read' });
            if (permission !== 'granted') {
                const request = await handle.requestPermission({ mode: 'read' });
                if (request !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            // Non-recursive scan
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const fileHandle = entry as FileSystemFileHandle;
                    const name = fileHandle.name;
                    const ext = name.split('.').pop()?.toLowerCase();

                    if (ext && IMAGE_EXTENSIONS.includes(ext)) {
                        newFiles.push({
                            name,
                            handle: fileHandle,
                            type: 'image',
                        });
                    }
                } else if (entry.kind === 'directory') {
                    newFolders.push({
                        name: entry.name,
                        handle: entry as FileSystemDirectoryHandle
                    });
                }
            }

            // Sort alphabetically
            newFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            newFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            setFiles(newFiles);
            setFolders(newFolders);
            setCurrentDirectoryHandle(handle);

        } catch (err: any) {
            console.error("Error reading directory:", err);
            setError(err.message || "Failed to read directory");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const openDirectory = useCallback(async () => {
        try {
            const handle = await window.showDirectoryPicker({
                mode: 'read'
            });
            // Reset stack when opening a new root directory
            setDirectoryStack([]);
            await loadFilesFromDirectory(handle);
            return handle;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Error opening directory:", err);
                setError("Failed to open directory");
            }
            return null;
        }
    }, [loadFilesFromDirectory]);

    const openDirectoryWithHandle = useCallback(async (handle: FileSystemDirectoryHandle) => {
        setDirectoryStack([]);
        await loadFilesFromDirectory(handle);
    }, [loadFilesFromDirectory]);

    const navigateToDirectory = useCallback(async (folder: FileSystemFolder, resetStack: boolean = false) => {
        if (resetStack) {
            // Reset stack when switching to a different root folder
            setDirectoryStack([]);
        } else if (currentDirectoryHandle) {
            // Add current directory to stack when navigating into a subfolder
            setDirectoryStack(prev => [...prev, currentDirectoryHandle]);
        }
        await loadFilesFromDirectory(folder.handle);
    }, [currentDirectoryHandle, loadFilesFromDirectory]);

    const navigateUp = useCallback(async () => {
        if (directoryStack.length === 0) return;

        const parent = directoryStack[directoryStack.length - 1];
        const newStack = directoryStack.slice(0, -1);

        setDirectoryStack(newStack);
        await loadFilesFromDirectory(parent);
    }, [directoryStack, loadFilesFromDirectory]);

    const getFileUrl = useCallback(async (fileHandle: FileSystemFileHandle) => {
        try {
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (err) {
            console.error("Error getting file URL:", err);
            return null;
        }
    }, []);

    return {
        currentDirectoryHandle,
        files,
        folders,
        isLoading,
        error,
        openDirectory,
        openDirectoryWithHandle,
        loadFilesFromDirectory,
        navigateToDirectory,
        navigateUp,
        canNavigateUp: directoryStack.length > 0,
        getFileUrl,
        path: [...directoryStack, currentDirectoryHandle].filter((h): h is FileSystemDirectoryHandle => h !== null)
    };
};
