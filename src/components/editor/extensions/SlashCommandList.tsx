import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Heading1, Heading2, Heading3, List, ListOrdered, type LucideIcon, Text, Quote, Minus } from 'lucide-react';

interface SlashCommandListProps {
    items: any[];
    command: any;
}

const icons: Record<string, LucideIcon> = {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Text,
    Quote,
    Minus
};

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = useCallback(
        (index: number) => {
            const item = props.items[index];

            if (item) {
                props.command(item);
            }
        },
        [props]
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }

            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }

            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }

            return false;
        },
    }));

    if (props.items.length === 0) {
        return null;
    }

    return (
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all">
            {props.items.map((item, index) => {
                const Icon = icons[item.icon] || Text;
                return (
                    <button
                        className={cn(
                            'flex w-full items-center space-x-2 rounded-sm px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100',
                            index === selectedIndex ? 'bg-stone-100' : ''
                        )}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-stone-500">{item.description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
});

SlashCommandList.displayName = 'SlashCommandList';
