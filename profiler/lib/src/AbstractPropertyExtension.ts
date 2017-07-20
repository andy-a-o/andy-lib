import {ProfilerExtension} from "./ProfilerExtension";

export interface AbstractPropertyExtensionOptions {
    props: string[];
}

export abstract class AbstractPropertyExtension extends ProfilerExtension {
    private readonly serializedProps: string;

    constructor(name: string, options: AbstractPropertyExtensionOptions) {
        super(name);
        const target = this.getTargetObject();
        const props = options.props;
        const values = new Array(props.length * 2);
        for (let i = 0, j = 0, n = props.length; i < n; ++i, j += 2) {
            const propertyName = props[i];
            values[j] = propertyName;
            values[j + 1] = target[propertyName];
        }
        this.serializedProps = values.join('|');
    }

    protected abstract getTargetObject(): any;

    serialize(): string {
        return this.serializedProps;
    }
}