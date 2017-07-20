import {ClientJob} from "./ClientJob";
import {Request, RequestListener} from "./Request";
import {RequestFactoryListener} from "./RequestFactory";

/**
 * A {@link RequestFactoryListener} that supports special response headers:
 * X-JOB-ID, X-JOB-NAME and X-JOB-ARGS.
 */
export class ClientJobScheduler implements RequestFactoryListener, RequestListener {
    private executedJobs: ClientJob[] = [];

    constructor(private jobNameConfig: {[name: string]: any}) {
    }

    onRequestCreated(request: Request) {
        request.addRequestListener(this);
        request.addHeader("X-ACCEPT-JOBS", true);
        if (this.executedJobs.length) {
            const nextJob = this.executedJobs.shift();
            if (nextJob) {
                const result = nextJob.getResult();
                request.addHeader("X-JOB-ID", nextJob.getId());
                request.addHeader("X-JOB-RESULT", result && JSON.stringify(result));
            }
        }
    }

    onRequestCompleted(request: Request, response: any, xmlHttpRequest: XMLHttpRequest) {
        request.removeRequestListener(this);
        let jobId = xmlHttpRequest.getResponseHeader("X-JOB-ID");
        if (!jobId) {
            return;
        }
        let jobName = xmlHttpRequest.getResponseHeader("X-JOB-NAME");
        if (!jobName) {
            console.error(`No Job class for job #${jobId}`);
            return;
        }
        const jobArgsJSON = xmlHttpRequest.getResponseHeader("X-JOB-ARGS");
        console.debug(`Received job ${jobName}/${jobId} with args ${jobArgsJSON}`);
        const jobArgs = jobArgsJSON && JSON.parse(jobArgsJSON);
        const jobClass = this.jobNameConfig[jobName];
        if (!jobClass) {
            console.error(`No Job registered with name ${jobName}`);
            return;
        }
        const job = <ClientJob>(new jobClass(jobId, jobName, jobArgs));
        job.addJobListener(this);
        job.execute();
    }

    onJobExecuted(job: ClientJob) {
        job.removeJobListener(this);
        this.executedJobs.push(job);
        console.debug(`Job ${job.getName()}/${job.getId()} executed with result ${JSON.stringify(job.getResult())}`);
    }
}