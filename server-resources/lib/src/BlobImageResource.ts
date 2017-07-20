import {ImageResource} from "./ImageResource";
import {BlobRequest, BlobRequestListener} from "./BlobRequest";

/**
 * Loads image as a blob for more smoothly progress.
 */
export class BlobImageResource extends ImageResource implements BlobRequestListener {
    private request?: BlobRequest | undefined;
    private blobUrl?: string | undefined;

    cancel() {
        this.request && this.request.cancel();
    }

    protected loadFromUrl(url: string) {
        this.request = new BlobRequest(url);
        this.request.addRequestListener(this);
        this.request.load();
    }

    /**
     * @param request
     * @param progress 0-100
     */
    onBlobLoadProgress(request: BlobRequest, progress: number) {
        this.bytes = request.getBytesLoaded();
        this.fireProgress(progress);
    }

    onBlobLoadStarted(request: BlobRequest) {
        this.fireLoadStarted();
    }

    onBlobLoadError(request: BlobRequest, error: any) {
        this.fireError(error);
    }

    onBlobLoaded(request: BlobRequest, blob: Blob) {
        this.blobUrl = window.URL.createObjectURL(blob);
        super.loadFromUrl(this.blobUrl);
    }

    protected imageLoaded() {
        super.imageLoaded();
        window.URL.revokeObjectURL(this.blobUrl);
    }

    static isSupported(): boolean {
        return BlobRequest.isSupported();
    }
}