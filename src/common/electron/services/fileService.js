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
            } else if (args.file) {
                resolve(new Blob([args.file]));
            } else {
                reject(args.error);
            }
        });
    });
};

export const uploadLink = async url => {
    ipcRenderer.send('upload-file-link', url);
    return new Promise((resolve, reject) => {
        ipcRenderer.once('upload-file-link-result', (event, args) => {
            if (args.file) {
                resolve(args.file);
            } else {
                reject(args.error);
            }
        });
    });
};

export const isValidUrl = url => {
    let newUrl;
    try {
        newUrl = new URL(url);
    } catch (e) {
        return false;
    }
    return (
        (newUrl.protocol === 'http:' || newUrl.protocol === 'https:') &&
        newUrl.pathname?.length > 5 &&
        newUrl.pathname.slice(-4) === '.pdf'
    );
};

export const redirectToStartScreen = () => {
    return false;
};
