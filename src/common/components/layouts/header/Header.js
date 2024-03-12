import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { Link as MaterialLink, Typography } from '@material-ui/core';
import HelpOutline from '@material-ui/icons/HelpOutline';
import PolicyIcon from '@material-ui/icons/Policy';

import ResetButton from '../../shared/resetButton/ResetButton';
import AppPages from '../../AppPages';

import logo from './pdf4wcag_logo.svg';

import './Header.scss';

function Header() {
    const location = useLocation();
    const hideLinks = useMemo(
        () => location.pathname === AppPages.ABOUT || location.pathname === AppPages.PRIVACY_POLICY,
        [location.pathname]
    );
    return (
        <header className="app-header">
            <section className="app-header__left">
                <ResetButton
                    component={MaterialLink}
                    className="app-header-logo"
                    style={{ 'pointer-events': hideLinks ? 'none' : 'auto' }}
                >
                    <img src={logo} className="app-header-logo" alt="logo" />
                </ResetButton>
            </section>
            <section className="app-header__right">
                <Link
                    to={AppPages.ABOUT}
                    target="_blank"
                    className={classNames('app-link', 'about-link', { 'app-link_hidden': hideLinks })}
                >
                    <HelpOutline />
                    <Typography className="text-link">ABOUT</Typography>
                </Link>
                <Link
                    to={AppPages.PRIVACY_POLICY}
                    target="_blank"
                    className={classNames('app-link', 'policy-link', { 'app-link_hidden': hideLinks })}
                >
                    <PolicyIcon />
                    <Typography className="text-link">PRIVACY POLICY</Typography>
                </Link>
            </section>
        </header>
    );
}

export default Header;
