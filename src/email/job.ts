// import { EventEmitter } from "events";

// type Job = {
//     id: string;
//     name: string;
//     task: () => Promise<void>;
//     interval?: number; // For recurring jobs (in milliseconds)
//     timeout?: NodeJS.Timeout | null; // Timer reference for recurring jobs
// };

// type JobSchedulerOptions = {
//     /**
//      * 📝 Logging function for job events.
//      */
//     logEvent?: (
//         event: "scheduled" | "executed" | "failed" | "cancelled",
//         job: Job,
//         error?: Error
//     ) => void;
// };

// class JobScheduler extends EventEmitter {
//     private jobs: Map<string, Job> = new Map();
//     private logEvent: (event: string, job: Job, error?: Error) => void;

//     constructor(options: JobSchedulerOptions = {}) {
//         super();
//         this.logEvent =
//             options.logEvent ||
//             ((event, job, error) => {
//                 if (event === "failed") {
//                 } else {
//                     console.log(`[JOB] ${event.toUpperCase()} for ${job.name}`);
//                 }
//             });
//     }

//     /**
//      * Schedules a one-time job to run after a delay.
//      * @param name - The name of the job.
//      * @param task - The task to execute.
//      * @param delay - The delay (in milliseconds) before executing the job.
//      */
//     scheduleOneTimeJob(name: string, task: () => Promise<void>, delay: number): string {
//         const id = `${name}-${Date.now()}`;
//         const job: Job = { id, name, task };

//         const timeout = setTimeout(async () => {
//             try {
//                 await task();
//                 this.logEvent("executed", job);
//                 this.emit("executed", job);
//             } catch (error) {
//                 this.logEvent("failed", job, error as Error);
//                 this.emit("failed", job, error as Error);
//             } finally {
//                 this.jobs.delete(id);
//             }
//         }, delay);

//         job.timeout = timeout;
//         this.jobs.set(id, job);
//         this.logEvent("scheduled", job);

//         return id;
//     }

//     /**
//      * Schedules a recurring job to run at a fixed interval.
//      * @param name - The name of the job.
//      * @param task - The task to execute.
//      * @param interval - The interval (in milliseconds) between executions.
//      */
//     scheduleRecurringJob(name: string, task: () => Promise<void>, interval: number): string {
//         const id = `${name}-${Date.now()}`;
//         const job: Job = { id, name, task, interval };

//         const scheduleNextRun = async () => {
//             try {
//                 await task();
//                 this.logEvent("executed", job);
//                 this.emit("executed", job);
//             } catch (error) {
//                 this.logEvent("failed", job, error as Error);
//                 this.emit("failed", job, error as Error);
//             }

//             if (this.jobs.has(id)) {
//                 job.timeout = setTimeout(scheduleNextRun, interval);
//             }
//         };

//         job.timeout = setTimeout(scheduleNextRun, interval);
//         this.jobs.set(id, job);
//         this.logEvent("scheduled", job);

//         return id;
//     }

//     /**
//      * Cancels a scheduled job by its ID.
//      * @param id - The ID of the job to cancel.
//      */
//     cancelJob(id: string): boolean {
//         const job = this.jobs.get(id);
//         if (!job) {
//             this.logEvent("cancelled", { id, name: "unknown", task: () => { } });
//             return false;
//         }

//         if (job.timeout) {
//             clearTimeout(job.timeout);
//         }

//         this.jobs.delete(id);
//         this.logEvent("cancelled", job);
//         this.emit("cancelled", job);

//         return true;
//     }

//     /**
//      * Cancels all scheduled jobs.
//      */
//     cancelAllJobs(): void {
//         for (const [id, job] of this.jobs.entries()) {
//             if (job.timeout) {
//                 clearTimeout(job.timeout);
//             }
//             this.jobs.delete(id);
//             this.logEvent("cancelled", job);
//             this.emit("cancelled", job);
//         }
//     }
// }

// export const createJobScheduler = (options?: JobSchedulerOptions): JobScheduler => {
//     return new JobScheduler(options);
// };


// const scheduler = createJobScheduler({
//     logEvent: (event, job, error) => {
//         if (event === "failed") {
//             console.error(`[JOB] ${event.toUpperCase()} for ${job.name}: ${error?.message}`);
//         } else {
//             console.log(`[JOB] ${event.toUpperCase()} for ${job.name}`);
//         }
//     },
// });

// // Schedule a one-time job
// const oneTimeJobId = scheduler.scheduleOneTimeJob(
//     "SendWelcomeEmail",
//     async () => {
//         console.log("Sending welcome email...");
//         // Simulate an email-sending task
//     },
//     5000 // Delay of 5 seconds
// );

// // Schedule a recurring job
// const recurringJobId = scheduler.scheduleRecurringJob(
//     "CleanupDatabase",
//     async () => {
//         console.log("Cleaning up database...");
//         // Simulate a database cleanup task
//     },
//     10000 // Interval of 10 seconds
// );

// // Cancel a specific job
// console.log(oneTimeJobId)
// scheduler.cancelJob(oneTimeJobId);

// // Cancel all jobs
// scheduler.cancelAllJobs();