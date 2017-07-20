import {HashMap} from "@andy-lib/util";
import {ResourceConfig} from "./Resource";

export class ResourceMatcher {
    private readonly groups = new HashMap<boolean>();
    private includeNoGroup: boolean = false;

    setIncludeNoGroup(include: boolean): ResourceMatcher {
        this.includeNoGroup = include;
        return this;
    }

    excludeGroup(group: string): ResourceMatcher {
        this.groups.set(group, false);
        return this;
    }

    includeGroup(group: string): ResourceMatcher {
        this.groups.set(group, true);
        return this;
    }

    match(res: ResourceConfig): boolean {
        const group = res.rgroup;
        if (group) {
            return this.groups.get(group) === true;
        } else {
            return this.includeNoGroup;
        }
    }
}