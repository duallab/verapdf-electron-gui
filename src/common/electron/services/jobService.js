import { ipcRenderer } from 'electron';

export const getInfo = () => {
    return Promise.resolve({
        build: {
            version: process.env.REACT_APP_VERSION,
            time: new Date(Date.parse(process.env.REACT_APP_VERSION_DATE)).toString(),
        },
    });
};

export const getJob = id => {
    ipcRenderer.send('get-job', id);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('get-job-result', (event, args) => {
            if (args.job) {
                resolve(args.job);
            } else {
                reject(args.error);
            }
        });
    });
};

export const createJob = job => {
    ipcRenderer.send('create-job', job);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('create-job-result', (event, args) => {
            if (args.job) {
                resolve(args.job);
            } else {
                reject(args.error);
            }
        });
    });
};

export const updateJob = job => {
    ipcRenderer.send('upload-job', job);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('upload-job-result', (event, args) => {
            if (args.job) {
                resolve(args.job);
            } else {
                reject(args.error);
            }
        });
    });
};

export const executeJob = id => {
    ipcRenderer.send('execute-job', id);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('execute-job-result', (event, args) => {
            if (args.job) {
                resolve(args.job);
            } else {
                reject(args.error);
            }
        });
    });
};

export const cancelJob = id => {
    ipcRenderer.send('cancel-job', id);
};
