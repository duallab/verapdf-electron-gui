import * as db from '../../storages/IndexedDB';

const DB_NAME = 'pdfStorage';
const STORE_NAME = 'files';
const KEY = 'name';

const MAX_FILES = 10;

let pdfStorage;

const getStorage = async () => {
    if (!pdfStorage) {
        // TODO: generate uuid as key
        pdfStorage = await db.connect(DB_NAME, STORE_NAME, KEY);
    }
    return pdfStorage;
};

const getAllFiles = async () => {
    const result = (await getStorage()).getAll();
    const data = await result;
    const files = [];
    data.forEach(d => {
        if (!!data.file && !!data.path) {
            const file = d.file;
            file.filepath = d.path;
            files.push(file);
        }
    });
    return files;
};

const getFile = async fileName => {
    const result = (await getStorage()).getOne(fileName);
    const data = await result;
    if (!data.file || !data.path) return null;
    const file = data.file;
    file.filepath = data.path;
    return file;
};

const setFile = async file => {
    let storage = await getStorage();
    let files = await storage.getAll();
    if (files.length >= MAX_FILES) {
        // TODO: replace this dumb implementation with something smarter in the future
        //  since files are ordered alphabetically and A.pdf will be always removed before B.pdf even if it was added later
        await storage.deleteOne(files[0].name);
    }
    return storage.setOne({ file, path: file.path, name: file.name });
};

const deleteFile = async file => {
    let storage = await getStorage();
    return await storage.deleteOne(file.name);
};

export { getAllFiles, setFile, getFile, deleteFile };
