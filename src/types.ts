export type Shortcut = {
    name: string;
    genus: string;
    species: string;
    show: boolean;
    comment: string;
};

export type ShortcutCategory = {
    category: string;
    items: Shortcut[];
};