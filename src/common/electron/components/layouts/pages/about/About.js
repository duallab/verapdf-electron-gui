/* eslint-disable no-unused-expressions */
import { shell, ipcRenderer } from 'electron';
import React from 'react';
import ReactMd from 'react-md-file';

import FatalErrorMessage from '../../../../../components/shared/fatalError/FatalErrorMessage';
import './About.scss';

export default class AboutElectron extends React.Component {
    constructor(props) {
        super(props);
        this.state = { md: null, error: null, visible: false };
    }

    componentDidUpdate() {
        if (this.state.md) {
            document.querySelectorAll('.react-md a')?.forEach(a => {
                a.addEventListener('click', e => {
                    e.preventDefault();
                    shell.openExternal(e.target.href);
                });
            });
        }
    }

    render() {
        if (!this.state.md) {
            import('../../../../../../static/ABOUT.md')
                .then(i => {
                    this.setState({ md: i.default });
                })
                .catch(err => {
                    this.setState({ error: new Error(err.message || err) });
                });
        }

        return (
            <>
                <section className="about">
                    {!this.state.md && !this.state.error ? null : this.state.md ? (
                        <ReactMd markdown={this.state.md} />
                    ) : (
                        <FatalErrorMessage message={this.state.error.message} />
                    )}
                </section>
                <section align="center" style={{ margin: '10px' }}>
                    <button
                        onClick={() => {
                            ipcRenderer.send('get-warning-message');
                            ipcRenderer.once('get-warning-message-result', (e, warnings) => {
                                this.setState({ visible: true, warnings });
                            });
                        }}
                    >
                        Show Logs
                    </button>
                </section>
                <section
                    align="left"
                    className="warnings"
                    style={{
                        display: this.state.visible ? 'block' : 'none',
                        padding: this.state.warnings ? '0 40px 20px' : '0',
                        wordWrap: 'break-word',
                    }}
                >
                    <h3 align="center">{this.state.warnings ? 'Warnings' : 'No warnings found'}</h3>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{this.state.warnings}</div>
                </section>
            </>
        );
    }
}
