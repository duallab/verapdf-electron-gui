/* eslint-disable prettier/prettier */
import { app, BrowserWindow, screen, Menu, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v1 as uuidv1 } from 'uuid';

import { JOB_STATUS, TASK_STATUS } from './common/store/constants'

const profilesNames = {
    'WCAG-21-Complete.xml': {
        humanReadableName: 'WCAG 2.1 (All)',
        profileIndex: 1,
    },
    'PDFUA-1.xml': {
        humanReadableName: 'PDF/UA-1 (Machine)',
        profileIndex: 4,
    },
    'ISO-32005-Tagged.xml': {
        humanReadableName: 'Tagged PDF',
        profileIndex: 5,
    },
    'WCAG-21.xml': {
        humanReadableName: 'WCAG 2.1 (Extra)',
        profileIndex: 2,
    },
    'WCAG-21-Dev.xml': {
        humanReadableName: 'WCAG 2.1 (DEV)',
        profileIndex: 3,
    },
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const profilesPath = path.join(
    __dirname, 
    '..',
    'libs/veraPDF/profiles/veraPDF-validation-profiles-integration/PDF_UA'
);
let job = {};
let file = {};

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const createWindow = () => {
    let width, height;
    const factor = screen.getPrimaryDisplay().scaleFactor;
    if (factor === 1) {
        width = 1080;
        height = 800;
    } else if (factor >= 1.25 && factor < 1.5) {
        width = 865;
        height = 700;
    } else {
        width = 740;
        height = 600;
    }

    const win = new BrowserWindow({
        width,
        height,
        minWidth: width,
        minHeight: height,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            zoomFactor: 1.0 / factor,
        },
    });

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
  })

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
                            profileName: path.resolve(profilesPath, f),
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
            const files = result.filter(r => r.isFile()).map(r => r.name);
            if (args && typeof args?.profile === 'string' && files.find(f => path.basename(args.profile, '.xml') === path.basename(f, '.xml'))) {
                job = {
                    id: uuidv1(),
                    profile: args.profile,
                    status: JOB_STATUS.CREATED,
                    tasks: null,
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
                        event.sender.send('upload-file-result', { file: { id } });
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
            let reportText = '', errorText = '';
            const constFile = { ...file };
            job.status = JOB_STATUS.PROCESSING;
            job.tasks[0].status = TASK_STATUS.PROCESSING;
            const reportData = spawn(
                process.platform === 'win32' ? 'verapdf.bat' : './verapdf',
                ['-p', job.profile, '--format', 'json', constFile.tempPath],
                { cwd: path.resolve(__dirname, '..', 'libs/veraPDF') },
            );

            reportData.stdout.on('data', data => {
                reportText += (data ?? '').toString();
            });
            reportData.stdout.on('end', () => {
                fs.rm(constFile.tempPath, () => {});
                if (job.id === id) {                    
                    reportText = reportText.replaceAll(constFile.tempPath, constFile.realPath);
                    try {
                        const jobs = JSON.parse(reportText).report.jobs;
                        if (jobs.length === 0 || !jobs[0].validationResult) {
                            job.status = JOB_STATUS.ERROR;
                            job.tasks[0].status = TASK_STATUS.ERROR;
                            job.tasks[0].errorMessage = jobs[0]?.taskResult?.exception.message 
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
                errorText += (data ?? '').toString();
            });
            reportData.stderr.on('end', () => {
                if (job.id === id) {
                    errorText = errorText.replaceAll(constFile.tempPath, constFile.realPath);
                    job.tasks[0].warningMessage = errorText;
                }
            });
            reportData.on('error', err => {
                const errorMessage = err.message.replaceAll(constFile.tempPath, constFile.realPath);
                fs.rm(constFile.tempPath, () => {});
                job.status = JOB_STATUS.ERROR;
                job.tasks[0].status = TASK_STATUS.ERROR;
                job.tasks[0].errorMessage = errorMessage;
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
    if (job.id === id) {
        if (job.fileContent) {                
            event.sender.send('get-file-content-result', { fileContent: job.fileContent });
        } else {
            event.sender.send('get-file-content-result', { error: new Error(job.errorMessage) });
        }
    } else {
        event.sender.send('get-file-content-result', { error: new Error('Can\'t find such file content') });
    }
});

ipcMain.on('get-warning-message', (event) => {
    const warnings = job && job?.tasks?.length > 0 && job.tasks[0].warningMessage
    event.sender.send('get-warning-message-result', warnings);
});
