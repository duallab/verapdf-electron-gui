export const getInfo = () => {
    return Promise.resolve({ build: { apps: { version: process.env.VERAPDF_VERSION } } });
};

export const getAppsBuildInfo = version => {
    return Promise.resolve();
};
