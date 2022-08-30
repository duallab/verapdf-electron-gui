import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import './Loading.scss';

function Loading() {
    return (
        <section className="loading" title="Starting application...">
            <CircularProgress disableShrink={true} />
        </section>
    );
}

export default Loading;
