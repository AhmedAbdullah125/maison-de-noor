import React from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    dir?: 'ltr' | 'rtl';
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, dir = 'ltr', className }: RichTextEditorProps) {
    return (
        <div className={`rich-text-editor ${className || ''}`} dir={dir}>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={6}
                className="w-full resize-y rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-app-gold focus:ring-2 focus:ring-app-gold/10"
            />
        </div>
    );
}
