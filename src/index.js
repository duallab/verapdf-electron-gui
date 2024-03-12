/* eslint-disable prettier/prettier */
import { app, BrowserWindow, screen, Menu, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v1 as uuidv1 } from 'uuid';
import axios from 'axios';
import UserAgent from 'user-agents';

import { JOB_STATUS, TASK_STATUS } from './common/store/constants'

const profilesNames = {
    'WCAG-2-2-Complete.xml': {
        profileName: 'WCAG_2_2_COMPLETE',
        humanReadableName: 'WCAG 2.2 Machine & Human (experimental)',
        profileIndex: 1,
    },
    'WCAG-2-2-Machine.xml': {
        profileName: 'WCAG_2_2_MACHINE',
        humanReadableName: 'WCAG 2.2 (Machine)',
        profileIndex: 2,
    },
    'WCAG-2-2.xml': {
        profileName: 'WCAG_2_2_HUMAN',
        humanReadableName: 'WCAG 2.2 (Human)',
        profileIndex: 3,
    },
    'PDFUA-1.xml': {
        profileName: 'PDFUA_1',
        humanReadableName: 'PDF/UA-1',
        profileIndex: 4,
    },
    'PDFUA-2.xml': {
        profileName: 'PDFUA_2',
        humanReadableName: 'PDF/UA-2',
        profileIndex: 5,
    },
    'PDFUA-2-ISO32005.xml': {
        profileName: 'PDFUA_2_TAGGED_PDF',
        humanReadableName: 'PDF/UA-2 & ISO 32005',
        profileIndex: 6,
    },
    'ISO-32005-Tagged.xml': {
        profileName: 'TAGGED_PDF',
        humanReadableName: 'ISO 32005',
        profileIndex: 7,
    },
}

const progressRegExp = /Progress: \d+ checks \/ \d+ failed \/ \d+ processed objects \/ \d+ in stack\./g;

const axiosInstance = axios.create({
    timeout: 5000,
    headers: { 'User-Agent': new UserAgent().toString() },
});
const isDevelopment = process.env.NODE_ENV !== 'production';
const profilesPath = path.join(
    __dirname, 
    '..',
    'libs/veraPDF/profiles/veraPDF-validation-profiles-integration/PDF_UA'
);
let job = {};
let file = {};
let controller;
let width, height;

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const createWindow = () => {
    const { size, scaleFactor } = screen.getPrimaryDisplay();

    if (scaleFactor <= 1) {
        width = size.width / 2;
        height = size.height / 1.5;
    } else if (scaleFactor >= 1.25 && scaleFactor < 1.5) {
        width = size.width / 1.5;
        height = size.height / 1.25;
    } else {
        width = size.width / 1.25;
        height = size.height / 1.1;
    }

    width = Math.round(width); 
    height = Math.round(height);

    const win = new BrowserWindow({
        width,
        height,
        minWidth: width,
        minHeight: height,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.once('ready-to-show', () => {
        win.show();
    })

    if (isDevelopment) win.webContents.openDevTools();

    Menu.setApplicationMenu(null);
    if (isDevelopment) {
        process.env.PUBLIC_URL = '/'
        win.loadURL(`http://${process.env.ELECTRON_WEBPACK_WDS_HOST}:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    } else {
        const filePath = path.resolve(__dirname, 'index.html');
        process.env.PUBLIC_URL = new URL(filePath, 'file://').href;
        win.loadFile(filePath);
    }
};

app.on('web-contents-created', (e, contents) => {
    if (contents.getType() === 'window') {
      contents.on('will-navigate', (e, s) => {
        job = {};
        file = {};
      });
      contents.setWindowOpenHandler((details) => {
        if (!details.url.includes('localhost') && !details.url.includes('file:///')) 
            shell.openExternal(details.url);
        else {
            const win = new BrowserWindow({
                width,
                height,
                minWidth: width,
                minHeight: height,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                }
            });
            Menu.setApplicationMenu(null);
            win.loadURL(details.url);
        }
        return {action: 'deny'};
      })
    }
});

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('get-profiles', event => {
    fs.readdir(profilesPath, { withFileTypes: true }, (err, result) => {
        if (err) {
            event.sender.send('get-profiles-result', null);
        } else {
            let profiles = null;
            const files = result.filter(r => r.isFile() && path.extname(r.name) === '.xml').map(r => r.name);
            if (files.length > 0) {
                profiles = [];
                files.forEach(f => {
                    const p = profilesNames[f];
                    if (p) {
                        profiles.push({
                            humanReadableName: p.humanReadableName,
                            profileIndex: p.profileIndex,
                            profileName: p.profileName,
                            enabled: true,
                        });
                    }
                });
            }
            event.sender.send('get-profiles-result', profiles.sort((a, b) => a.profileIndex - b.profileIndex));
        }
    });
});

ipcMain.on('get-job', (event, id) => {
    if (job.id === id) {
        event.sender.send('get-job-result', { job });
    } else {
        event.sender.send('get-job-result', { error: new Error('Can\'t find such job') });
    }
});

ipcMain.on('create-job', (event, args) => {
    fs.readdir(profilesPath, { withFileTypes: true }, (error, result) => {
        if (error) {
            event.sender.send('create-job-result', { error });
        } else {
            const files = result.filter(r => r.isFile()).map(r => path.basename(r.name));
            const profileName = args?.profile && files.find(f => profilesNames[f]?.profileName === args.profile);
            if (profileName) {
                job = {
                    id: uuidv1(),
                    profile: path.resolve(profilesPath, profileName),
                    status: JOB_STATUS.CREATED,
                    tasks: null,
                    progress: null,
                };
                event.sender.send('create-job-result', { job });
            } else {
                event.sender.send('create-job-result', { error: new Error('Invalid profile') });
            }
        }
    });
});

ipcMain.on('upload-file', (event, filePath) => {
    if(typeof filePath === 'string') {
        fs.access(filePath, err => {
            if (!err) {
                const id = uuidv1();
                const newFilePath = path.resolve(__dirname, '..', 'libs', `${id}.pdf`);
                fs.copyFile(filePath, newFilePath, err => {
                    if (!err) {
                        file = { tempPath: newFilePath, realPath: filePath };
                        event.sender.send(
                            'upload-file-result',
                            { file: { id, fileName: path.basename(filePath) } },
                        );
                    } else {
                        event.sender.send(
                            'upload-file-result', 
                            { error: new Error('Some error occurred while preparing the file') }
                        );
                    }
                });
            } else {
                event.sender.send('upload-file-result', { error: new Error('Can\'t find such file') });
            }
        });
    } else {
        event.sender.send('upload-file-result', { error: new Error('File path must be string') });
    }
});

ipcMain.on('upload-file-link', async (event, url) => {
    let arrayBuffer;
    try {
        const res = await axiosInstance.get(url, { responseType: 'arraybuffer' });
        if (res.status !== 200 || res.headers['content-type'] !== 'application/pdf') {
            event.sender.send('upload-file-link-result', { error: new Error('Error while extracting file from url.') });
            return;
        }
        arrayBuffer = res.data;
        const id = uuidv1();
        const newFilePath = path.resolve(__dirname, '..', 'libs', `${id}.pdf`);
        fs.writeFile(newFilePath, arrayBuffer, err => {
            if (!err) {
                file = { tempPath: newFilePath, realPath: url };
                event.sender.send('upload-file-link-result', { file: { id, fileName: url.split('/').slice(-1)[0] } });
            } else {
                event.sender.send('upload-file-link-result', { error: new Error('Error while saving file on disk.') });
            }
        });
    } catch (e) {
        event.sender.send('upload-file-link-result', { error: new Error('Error while extracting file from url and saving it on disk.') });
    }
});

ipcMain.on('upload-job', (event, j) => {
    if (typeof j === 'object' && job.id === j.id && job.profile === j.profile && j.tasks?.length > 0) {
        job = j;
        job.tasks[0].status = TASK_STATUS.CREATED;
        event.sender.send('upload-job-result', { job });
    } else {
        event.sender.send('upload-job-result', { error: new Error('Can\'t find such job') });
    }
});

ipcMain.on('execute-job', (event, id) => {
    try {
        if (job.id === id && job.tasks[0].fileId === path.basename(file.tempPath, '.pdf')) {
            let reportText = '', progressText = '';
            const constFile = { ...file };
            job.status = JOB_STATUS.PROCESSING;
            job.tasks[0].status = TASK_STATUS.PROCESSING;
            job.progress = 'Progress: 0 checks, 0 failed, 0 processed objects, 0 in stack.'
            controller = new AbortController();
            const { signal } = controller;
            const reportData = spawn(
                process.platform === 'win32' ? 'verapdf.bat' : './verapdf',
                ['-p', job.profile, '--progress', 'true', '--format', 'json', constFile.tempPath],
                { cwd: path.resolve(__dirname, '..', 'libs/veraPDF'), signal },
            );
            reportData.stdout.on('data', data => {
                reportText += (data ?? '').toString();
            });
            reportData.stdout.on('end', () => {
                fs.rm(constFile.tempPath, () => {});
                if (job.id === id && job.status !== JOB_STATUS.CANCELLED) {
                    reportText = reportText.replaceAll(constFile.tempPath, constFile.realPath);
                    try {
                        const jobs = JSON.parse(reportText).report.jobs;
                        if (jobs.length === 0 || !jobs[0].validationResult) {
                            job.status = JOB_STATUS.ERROR;
                            job.tasks[0].status = TASK_STATUS.ERROR;
                            job.tasks[0].errorMessage = jobs[0]?.taskException?.exception
                                || jobs[0]?.taskResult?.exception.message
                                || 'No validation result';
                        } else {
                            job.status = JOB_STATUS.FINISHED;
                            job.tasks[0].status = TASK_STATUS.FINISHED;
                            job.tasks[0].validationResultId = job.id;
                            job.fileContent = jobs[0].validationResult;
                        }
                    } catch(error) {
                        job.status = JOB_STATUS.ERROR;
                        job.tasks[0].status = TASK_STATUS.ERROR;
                        job.tasks[0].errorMessage = error.message || error;
                    }
                }
            });
            reportData.stderr.on('data', data => {
                progressText += (data ?? '').toString();
                const message = progressText.match(progressRegExp)?.pop();
                if (message && job.id === id) job.progress = message;
            });
            reportData.stderr.on('end', () => {
                if (job.id === id) job.progress = null;
            });
            reportData.on('error', err => {
                if (err.code === 'ABORT_ERR') {
                    fs.rm(constFile.tempPath, () => {});
                    job.status = JOB_STATUS.CANCELLED;
                    job.tasks[0].status = TASK_STATUS.CANCELLED;
                } else {
                    const errorMessage = err.message.replaceAll(constFile.tempPath, constFile.realPath);
                    fs.rm(constFile.tempPath, () => {});
                    job.status = JOB_STATUS.ERROR;
                    job.tasks[0].status = TASK_STATUS.ERROR;
                    job.tasks[0].errorMessage = errorMessage;
                }
            });

            event.sender.send('execute-job-result', { job });
        }
        else {
            event.sender.send('execute-job-result', { 
                error: new Error(`Can't find such ${job.id === id ? 'file' : 'job'}`) 
            });
        } 
    } catch (err) {
        event.sender.send('execute-job-result', err);
    } 
});

ipcMain.on('get-file-content', (event, id) => {
    const filePath = path.resolve(__dirname, '..', 'libs', `${id}.pdf`);
    if (job.id === id) {
        if (job.fileContent) {                
            event.sender.send('get-file-content-result', { fileContent: job.fileContent });
        } else {
            event.sender.send('get-file-content-result', { error: new Error(job.errorMessage) });
        }
    } else if (file.tempPath === filePath) {
        fs.readFile(filePath, (err, data) => {
            if (!err) {
                event.sender.send('get-file-content-result', { file: data });
            } else {
                event.sender.send('get-file-content-result', { error: new Error('Can\'t find such file') });
            }
        });
    } else {
        event.sender.send('get-file-content-result', { error: new Error('Can\'t find such file content') });
    }
});

ipcMain.on('get-warning-message', (event) => {
    const warnings = job && job?.tasks?.length > 0 && job.tasks[0].warningMessage
    event.sender.send('get-warning-message-result', warnings);
});

ipcMain.on('cancel-job', (event, id) => {
    if (controller && job?.id === id) {
        controller.abort();
        job.status = JOB_STATUS.CANCELLED;
        job.tasks[0].status = TASK_STATUS.CANCELLED;
        job.tasks[0].validationResultId = id;
    }
});
