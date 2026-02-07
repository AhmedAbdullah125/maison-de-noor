import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    dir?: 'ltr' | 'rtl';
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, dir = 'ltr', className }: RichTextEditorProps) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'direction': 'rtl' }],
            ['clean']
        ],
    }), []);

    return (
        <div className={`rich-text-editor ${className || ''}`} dir={dir}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder}
                className="bg-white rounded-2xl overflow-hidden"
            />
            <style jsx global>{`
                .ql-toolbar.ql-snow {
                    border: 1px solid #f3f4f6;
                    border-bottom: none;
                    border-radius: 1rem 1rem 0 0;
                    background: #f9fafb;
                }
                .ql-container.ql-snow {
                    border: 1px solid #f3f4f6;
                    border-radius: 0 0 1rem 1rem;
                    background: #f9fafb;
                    font-family: inherit;
                }
                .ql-editor {
                    min-height: 120px;
                    font-size: 0.875rem;
                }
                .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
            `}</style>
        </div>
    );
}
