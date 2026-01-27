export type GalleryItem = {
    preview: string;        // url (remote) or objectUrl (local)
    file?: File | null;     // موجودة فقط لو الصورة اتعملت Upload من الجهاز
    remote?: boolean;       // true لو جاية من API
    id?: number | string;   // optional لو عندك image id من API
};
