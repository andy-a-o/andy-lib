import {HashMap} from "@andy-lib/util";
import {Resource} from "./Resource";

export class ResourceCache {
    private readonly map = new HashMap<Resource>();

    get(src: string): Resource {
        return this.map.get(src);
    }

    add(resource: Resource) {
        this.map.set(resource.getSrc(), resource);
    }

    contains(src: string): boolean {
        return this.map.hasKey(src);
    }

    clear() {
        this.map.clear();
    }
}