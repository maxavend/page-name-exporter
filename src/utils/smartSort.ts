/**
 * Smart Sorting Logic for Figma Pages
 * 
 * Rules:
 * 1. Dividers: Lines containing only hyphens (e.g. "-", "--", "---") are separators.
 * 2. Sections: Pages between dividers are treated as a group.
 * 3. Sticky Headers: Pages starting with Emoji or ALL CAPS stay at top of section.
 * 4. Smart Sort:
 *    - Identify "Roots" (Shortest match at end of string, e.g. "Card" for "Price Card").
 *    - Sort Roots alphabetically.
 *    - Children follow their Root alphabetically.
 *    - Orphans sorted alphabetically.
 */

// Regex to check if a string contains only hyphens (and at least one)
const isDivider = (name: string) => /^[-]+$/.test(name.trim());

// Regex for Emoji (basic ranges) or ALL CAPS (allowing non-letters like numbers/spaces, but no lowercase)
// ALL CAPS: Has at least one uppercase letter (to avoid empty/numbers only) and no lowercase.
const isStickyHeader = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return false;

    // Emoji check (simplified)
    // Ranges: \u{1F300}-\u{1F9FF} etc. Using a broad check for non-ascii or specific ranges if possible.
    // Actually, standard emoji regex is complex. Let's use a simpler heuristic:
    // Starts with non-ascii character?
    const firstChar = trimmed.codePointAt(0) || 0;
    const isEmoji = firstChar > 255; // weak check, but covers most emojis. 
    // Better emoji check:
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    if (emojiRegex.test(trimmed[0])) return true;

    // ALL CAPS check
    const hasUpperCase = /[A-Z]/.test(trimmed);
    const hasLowerCase = /[a-z]/.test(trimmed);
    if (hasUpperCase && !hasLowerCase) return true;

    return false;
};

const isSequenceBreaker = (name: string) => {
    return isDivider(name) || isStickyHeader(name);
};

export function sortPagesSmartly(names: string[]): string[] {
    const result: string[] = [];
    let currentSection: string[] = [];
    let currentHeader: string | null = null;

    const flushSection = () => {
        if (currentSection.length > 0) {
            // Sort the accumulated section items (excluding the header if explicitly stored)
            // But here currentSection contains everything since the last header/divider.
            // Actually, if we hit a header, that header BELONGS to the NEW section.
            // So we flush the OLD section.
            result.push(...sortSection(currentSection));
            currentSection = [];
        }
    };

    for (const name of names) {
        if (isSequenceBreaker(name)) {
            flushSection();
            // Start new section with this breaker.
            // But wait, isDivider means it's a separator. isStickyHeader means it's a Title.
            // Divider should be flushed immediately? 
            // "Uno ejemplo, todo lo que esté debajo de eso, hasta que comience nuevamente algún parámetro como: TITULO..."
            // Divider is also a boundary.

            // If it's a breaker, it stays at the top of the NEW section (or is the separator).
            // We just add it to the result immediately? 
            // "Sort items WITHIN sections".
            // If I have "TITLE", "A", "B". "TITLE" is top. "A","B" sorted.
            // If I push TITLE to 'currentSection', then 'sortSection' will see it as sticky and keep it top.
            // That works.
            currentSection.push(name);
        } else {
            currentSection.push(name);
        }
    }
    flushSection();

    return result;
}

function sortSection(items: string[]): string[] {
    const sticky: string[] = [];
    const regular: string[] = [];

    for (const item of items) {
        if (isStickyHeader(item)) {
            sticky.push(item);
        } else {
            regular.push(item);
        }
    }

    // Sticky items: Just keep them at top? Or sort them? 
    // "Stays at the top of that section". Implies preserving order or stable sort. 
    // Let's keep original relative order for sticky items to be safe, 
    // or sort alphabetically if that's preferred. Prompt says "Standard Sort: Remaining items...". 
    // Sticky logic just says "stays at the top". I'll keep them in original relative order found in that section.

    // Regular items: Smart Sort.
    const sortedRegular = smartSortRegular(regular);

    return [...sticky, ...sortedRegular];
}

function smartSortRegular(items: string[]): string[] {
    // 1. Identify Parents.
    // A parent is an item X present in 'items' such that another item Y ends with " " + X.
    // We want the SHORTEST match at end.
    const parentMap = new Map<string, string[]>(); // Parent -> Children
    const parents = new Set<string>();
    const orphans: string[] = [];

    // Initialize potential parents
    const potentialParents = new Set(items);

    // Assign each item to a parent or mark as potential parent/orphan
    // We need to determine if 'item' IS a child of any 'p' in 'potentialParents'.
    // If multiple, pick shortest 'p'.
    // If 'item' IS a parent itself, it will be handled as a key in 'parentMap'.

    // Wait, if "Card" is in list, it is a parent.
    // If "Card" is NOT in list, "Price Card" is an orphan (or parent of "Premium Price Card").
    // The logic implies we only group under VALID parents existing in the list.

    const relationships = new Map<string, string>(); // Child -> Parent

    for (const item of items) {
        let bestParent: string | null = null;

        for (const p of potentialParents) {
            if (item === p) continue;
            // Check if item ends with " " + p
            if (item.endsWith(' ' + p)) {
                // Found a candidate parent.
                // We want the SHORTEST parent string.
                if (!bestParent || p.length < bestParent.length) {
                    bestParent = p;
                }
            }
        }

        if (bestParent) {
            relationships.set(item, bestParent);
            parents.add(bestParent);
        }
    }

    // Now group
    // Items that are parents themselves go to 'roots'.
    // Items that are not parents and have no parent go to 'orphans'.
    // Items that are children go to their parent's list.

    const roots: string[] = [];

    // Categorize
    for (const item of items) {
        if (parents.has(item)) {
            // It is a parent, so it's a root.
            // (Even if it is logically a child of another? e.g. "Card" vs "Space Card" vs "Deep Space Card". 
            // "Space Card" is parent of "Deep Space Card". "Card" is parent of "Space Card".
            // Prompt says "Shortest match at end".
            // "Deep Space Card" matches "Space Card" and "Card". "Card" is shorter.
            // So "Deep Space Card" -> "Card". 
            // So multilevel nesting isn't strictly happening with "Shortest match" rule if we compare against ALL.)
            // My logic above compares against ALL, so "Deep Space Card" will pick "Card" (length 4) over "Space Card" (length 10).
            // So it strictly flattens to the absolute root.
            if (!roots.includes(item)) roots.push(item);
        } else if (relationships.has(item)) {
            // It is a child.
            const p = relationships.get(item)!;
            if (!parentMap.has(p)) parentMap.set(p, []);
            parentMap.get(p)!.push(item);
        } else {
            // Orphan
            orphans.push(item);
        }
    }

    // Sort Roots and Orphans
    roots.sort((a, b) => a.localeCompare(b));
    orphans.sort((a, b) => a.localeCompare(b));

    // Construct result
    const final: string[] = [];

    // Roots come first? Prompt: "1. Parent-Child... 2. Standard Sort: Remaining".
    // This implies Roots+Children are group 1, Orphans are group 2.
    // Or do we mix Roots and Orphans sorted alphabetically?
    // "Parent-Child Grouping" ... "Remaining items...". 
    // It suggests we process Parent-Child groups first.

    // Wait, if I have "Alien" (Orphan) and "Card" (Parent). 
    // Should "Alien" come before "Card"?
    // A standard list usually sorts everything alpha, but keeps children with parents.
    // "Alien"
    // "Card"
    //   "Blue Card"
    // "Zebra"

    // Prompt: "1. Parent-Child Grouping... 2. Standard Sort". 
    // This might simply describe the rules.
    // Usually the desired outcome is a sorted list where children follow parents.
    // I will sort (Roots + Orphans) together alphabetically.
    // If an item is a Root, output it, then its children.

    const allTopLevel = [...roots, ...orphans];
    allTopLevel.sort((a, b) => a.localeCompare(b));

    for (const item of allTopLevel) {
        final.push(item);
        if (parents.has(item)) {
            const children = parentMap.get(item) || [];
            children.sort((a, b) => a.localeCompare(b));
            final.push(...children);
        }
    }

    return final;
}
