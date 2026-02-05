/// <reference types="@figma/plugin-typings" />

// State to store previous order for "Rescue" functionality
let previousOrder: string[] = [];

// Show UI
figma.showUI(__html__, { width: 620, height: 500, themeColors: true });

figma.ui.onmessage = (msg) => {
    if (msg.type === 'get-pages') {
        const names = figma.root.children.map((node) => node.name);
        figma.ui.postMessage({ type: 'init-pages', payload: names });
    }
    else if (msg.type === 'reorder-pages') {
        const newNames: string[] = msg.names;
        reorderPages(newNames);
        figma.ui.postMessage({ type: 'reorder-complete' });
    }
    else if (msg.type === 'restore-order') {
        if (previousOrder.length > 0) {
            restoreOrder(previousOrder);
            figma.ui.postMessage({ type: 'order-restored' });
        } else {
            figma.ui.postMessage({ type: 'error', payload: 'No previous order saved.' });
        }
    }
};

function reorderPages(newNames: string[]) {
    // 1. Snapshot current order IDs
    previousOrder = figma.root.children.map(p => p.id);

    // 2. Create Map of Name -> Nodes[]
    const currentPages = figma.root.children;
    const nameMap = new Map<string, PageNode[]>();

    for (const page of currentPages) {
        // Normalize name for matching (trim whitespace)
        const normalizedName = page.name.trim();
        if (!nameMap.has(normalizedName)) {
            nameMap.set(normalizedName, []);
        }
        nameMap.get(normalizedName)!.push(page as PageNode);
    }

    // 3. Reorder & Create
    let currentIndex = 0;
    for (const rawName of newNames) {
        const name = rawName.trim();
        if (!name) continue; // Skip empty lines

        const nodes = nameMap.get(name);

        if (nodes && nodes.length > 0) {
            // CASE A: Page exists (matched by trimmed name)
            const pageToMove = nodes.shift()!;
            figma.root.insertChild(currentIndex, pageToMove);

            // Update name to strictly match input (fix spacing/case if needed)
            if (pageToMove.name !== name) {
                pageToMove.name = name;
            }
            currentIndex++;
        } else {
            // CASE B: Page does not exist -> Create it
            const newPage = figma.createPage();
            newPage.name = name;
            figma.root.insertChild(currentIndex, newPage);
            currentIndex++;
        }
    }

    // 4. Handle remaining pages (Not in newNames)
    // Existing pages that were NOT moved are now at indices >= currentIndex.
    // They remain there (at the end).
}

function restoreOrder(ids: string[]) {
    // Map ID -> PageNode
    const idMap = new Map<string, PageNode>();
    for (const page of figma.root.children) {
        idMap.set(page.id, page as PageNode);
    }

    let currentIndex = 0;
    for (const id of ids) {
        const page = idMap.get(id);
        if (page) {
            figma.root.insertChild(currentIndex, page);
            currentIndex++;
        }
    }
}
