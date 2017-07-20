import {Listeners} from "@andy-lib/util";

export interface ClientJobListener {
    onJobExecuted(job: ClientJob);
}

export abstract class ClientJob {
    private readonly jobListeners = new Listeners<ClientJobListener>(["onJobExecuted"]);

    private result: any | undefined;

    constructor(private id: string, private name: string) {
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    setResult(result: any) {
        this.result = result;
    }

    getResult(): any | undefined {
        return this.result;
    }

    addJobListener(l: ClientJobListener) {
        this.jobListeners.add(l);
    }

    removeJobListener(l: ClientJobListener) {
        this.jobListeners.remove(l);
    }

    protected fireExecuted() {
        this.jobListeners.call("onJobExecuted", [this]);
    }

    abstract execute();
}