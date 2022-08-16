/* eslint-disable prettier/prettier */
import { ipcRenderer } from 'electron';

export const getList = () => {
    ipcRenderer.send('get-profiles');
    return new Promise((resolve, reject) => {
        ipcRenderer.once('get-profiles-result', (event, args) => {
            if (args) resolve(args);
            else reject(new Error('Can\'t find profiles'));
        });
    });
};
