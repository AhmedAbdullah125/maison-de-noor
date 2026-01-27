import React from "react";
import { Upload, Plus, Star, Trash2, Image as ImageIcon } from "lucide-react";
import { GalleryItem } from "../types";

export default function MediaCard({
    mainImagePreview,
    onMainImageUpload,
    onRemoveMainImage,
    gallery,
    onGalleryUpload,
    onSetAsMain,
    onRemoveGalleryImage,
}: {
    mainImagePreview: string;
    onMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveMainImage: () => void;
    gallery: GalleryItem[];
    onGalleryUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetAsMain: (index: number) => void;
    onRemoveGalleryImage: (index: number) => void;
}) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-50 pb-4">
                Service Media
            </h3>

            {/* Main Image */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Main Image (Required)
                </label>

                {mainImagePreview ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden group border border-gray-200">
                        <img src={String(mainImagePreview)} className="w-full h-full object-cover" alt="Main" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="cursor-pointer px-4 py-2 bg-white rounded-xl text-xs font-semibold hover:bg-gray-100">
                                Change
                                <input type="file" className="hidden" accept="image/*" onChange={onMainImageUpload} />
                            </label>
                            <button
                                onClick={onRemoveMainImage}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#483383] hover:bg-violet-50 transition-all bg-gray-50">
                        <Upload size={32} className="text-gray-300" />
                        <span className="text-sm font-semibold text-gray-400 mt-2">Upload Main Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={onMainImageUpload} />
                    </label>
                )}
            </div>

            {/* Gallery */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Gallery Images</label>
                    <label className="cursor-pointer text-[#483383] text-xs font-semibold hover:underline flex items-center gap-1">
                        <Plus size={14} /> Add Images
                        <input type="file" multiple className="hidden" accept="image/*" onChange={onGalleryUpload} />
                    </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {gallery.map((g, idx) => (
                        <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 bg-gray-50"
                        >
                            <img src={g.preview} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onSetAsMain(idx)}
                                    className="p-1.5 bg-white/90 rounded-lg text-yellow-500 hover:bg-white shadow-sm"
                                    title="Set as Main"
                                >
                                    <Star size={12} fill="currentColor" />
                                </button>
                                <button
                                    onClick={() => onRemoveGalleryImage(idx)}
                                    className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white shadow-sm"
                                    title="Remove"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {gallery.length === 0 && (
                        <div className="col-span-3 py-8 text-center border border-dashed border-gray-200 rounded-2xl">
                            <ImageIcon size={24} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-xs font-semibold text-gray-400">No gallery images</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
