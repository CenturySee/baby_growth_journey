// Simple hash-based router

type RouteHandler = () => void;

const routes: Map<string, RouteHandler> = new Map();

export function registerRoute(path: string, handler: RouteHandler) {
    routes.set(path, handler);
}

export function navigate(path: string) {
    window.location.hash = path;
}

export function getCurrentRoute(): string {
    return window.location.hash.slice(1) || '/';
}

export function startRouter() {
    const handleRoute = () => {
        const path = getCurrentRoute();
        const handler = routes.get(path);
        if (handler) {
            handler();
        } else {
            // Default to home
            const homeHandler = routes.get('/');
            if (homeHandler) homeHandler();
        }
    };

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
