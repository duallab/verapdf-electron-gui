import { ipcRenderer } from 'electron';

export const getInfo = () => {
    return Promise.resolve({
        build: {
            version: process.env.REACT_APP_VERSION,
            time: new Date(Date.parse(process.env.REACT_APP_VERSION_DATE)).toString(),
        },
    });
};

export const uploadFile = async file => {
    ipcRenderer.send('upload-file', file?.path || file?.filepath);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('upload-file-result', (event, args) => {
            if (args.file) {
                resolve(args.file);
            } else {
                reject(args.error);
            }
        });
    });
};

export const getFileContent = id => {
    ipcRenderer.send('get-file-content', id);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('get-file-content-result', (event, args) => {
            if (args.fileContent) {
                resolve(args.fileContent);
            } else {
                reject(args.error);
            }
        });
    });
};
