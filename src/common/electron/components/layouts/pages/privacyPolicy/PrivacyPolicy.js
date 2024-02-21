/* eslint-disable no-unused-expressions */
import ReactMd from 'react-md-file';
import React, { useState, useEffect } from 'react';

import FatalErrorMessage from '../../../../../components/shared/fatalError/FatalErrorMessage';
import './PrivacyPolicy.scss';

function PrivacyPolicyElectron() {
    const [md, setMD] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        import('../../../../../../static/PRIVACY_POLICY.md')
            .then(i => setMD(i.default))
            .catch(err => setError(new Error(err.message || err).message));
    }, []);
    return (
        <section className="privacy-policy">
            {(md && <ReactMd markdown={md} />) || (error && <FatalErrorMessage message={error} />) || null}
        </section>
    );
}

export default PrivacyPolicyElectron;
