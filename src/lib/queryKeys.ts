export const queryKeys = {
    all: ['notion'] as const,
    workspace: () => [...queryKeys.all, 'workspace'] as const,
    sidebar: {
        root: (userId?: string) => [...queryKeys.workspace(), 'sidebar', 'root', userId] as const,
        children: (parentId: string) => [...queryKeys.workspace(), 'sidebar', 'children', parentId] as const,
        teamSpaces: (userId?: string) => [...queryKeys.workspace(), 'teamSpaces', userId] as const,
        favorites: (userId?: string) => [...queryKeys.workspace(), 'favorites', userId] as const,
        trash: (userId?: string) => [...queryKeys.workspace(), 'trash', userId] as const,
    },
    pages: {
        all: () => [...queryKeys.all, 'pages'] as const,
        detail: (id: string) => [...queryKeys.pages.all(), id] as const,
    },
    blocks: {
        all: (pageId: string) => [...queryKeys.pages.detail(pageId), 'blocks'] as const,
    },
    database: {
        properties: (id: string) => [...queryKeys.all, 'database', id, 'properties'] as const,
        rows: (id: string) => [...queryKeys.all, 'database', id, 'rows'] as const,
    }
};
