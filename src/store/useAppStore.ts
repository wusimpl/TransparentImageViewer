import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { FileSystemFile } from '../hooks/useFileSystem';

interface FavoriteDirectory {
    name: string;
    handle: FileSystemDirectoryHandle;
    addedAt: number;
}

interface AppState {
    currentDirectoryHandle: FileSystemDirectoryHandle | null;
    files: FileSystemFile[];
    favoriteDirectories: FavoriteDirectory[];
    isLoading: boolean;

    setCurrentDirectory: (handle: FileSystemDirectoryHandle, files: FileSystemFile[]) => void;
    addFavoriteDirectory: (handle: FileSystemDirectoryHandle) => Promise<void>;
    toggleFavorite: (handle: FileSystemDirectoryHandle) => Promise<void>;
    loadFavoriteDirectories: () => Promise<void>;
    removeFavoriteDirectory: (name: string) => Promise<void>;
    setLoading: (loading: boolean) => void;
}

const FAVORITES_KEY = 'favorite_directories';

export const useAppStore = create<AppState>((setState, get) => ({
    currentDirectoryHandle: null,
    files: [],
    favoriteDirectories: [],
    isLoading: false,

    setCurrentDirectory: (handle, files) => {
        setState({ currentDirectoryHandle: handle, files });
    },

    addFavoriteDirectory: async (handle) => {
        const { favoriteDirectories } = get();
        const existingIndex = favoriteDirectories.findIndex(d => d.name === handle.name);

        let newFavorites = [...favoriteDirectories];

        if (existingIndex >= 0) {
            // Already exists, update timestamp to move to top
            newFavorites[existingIndex] = {
                ...newFavorites[existingIndex],
                addedAt: Date.now()
            };
        } else {
            // Add new
            newFavorites.push({
                name: handle.name,
                handle,
                addedAt: Date.now()
            });
        }

        // Sort by addedAt desc (newest first)
        newFavorites.sort((a, b) => b.addedAt - a.addedAt);

        setState({ favoriteDirectories: newFavorites });

        try {
            await idbSet(FAVORITES_KEY, newFavorites);
        } catch (err) {
            console.error("Failed to save favorite directories", err);
        }
    },

    toggleFavorite: async (handle) => {
        const { favoriteDirectories } = get();
        const existingIndex = favoriteDirectories.findIndex(d => d.name === handle.name);

        let newFavorites = [...favoriteDirectories];

        if (existingIndex >= 0) {
            // Remove
            newFavorites = newFavorites.filter(d => d.name !== handle.name);
        } else {
            // Add
            newFavorites.push({
                name: handle.name,
                handle,
                addedAt: Date.now()
            });
        }

        // Sort by addedAt desc (newest first)
        newFavorites.sort((a, b) => b.addedAt - a.addedAt);

        setState({ favoriteDirectories: newFavorites });

        try {
            await idbSet(FAVORITES_KEY, newFavorites);
        } catch (err) {
            console.error("Failed to save favorite directories", err);
        }
    },

    loadFavoriteDirectories: async () => {
        try {
            const favorites = (await idbGet(FAVORITES_KEY)) as FavoriteDirectory[];
            if (favorites) {
                setState({ favoriteDirectories: favorites });
            }
        } catch (err) {
            console.error("Failed to load favorite directories", err);
        }
    },

    removeFavoriteDirectory: async (name) => {
        const { favoriteDirectories } = get();
        const newFavorites = favoriteDirectories.filter(d => d.name !== name);
        setState({ favoriteDirectories: newFavorites });
        await idbSet(FAVORITES_KEY, newFavorites);
    },

    setLoading: (loading) => setState({ isLoading: loading })
}));
