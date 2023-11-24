'use client';

require('../polyfill');

import React, { useEffect, useState } from 'react';
import styles from './home.module.scss';

import { ReactComponent as BotIcon } from '../icons/bot.svg';
import { ReactComponent as LoadingIcon } from '../icons/three-dots.svg';

import { getCSSVar, useMobileScreen } from '../utils';

import { Path, SlotID } from '../constant';
import { ErrorBoundary } from './error';

import { getISOLang, getLang } from '../locales';

import { api } from '../client/api';
import { getClientConfig } from '../config/client';
import { useAccessStore, useChatPathStore } from '../store';
import { useAppConfig } from '../store/config';
import { AuthPage } from './auth';

const Settings: any = React.lazy(() => import('./settings'));

const Chat: any = React.lazy(() => import('./chat'));

const NewChat: any = React.lazy(() => import('./new-chat'));

const MaskPage: any = React.lazy(() => import('./mask'));

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles['loading-content'] + ' no-dark'}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove('light');
    document.body.classList.remove('dark');

    if (config.theme === 'dark') {
      document.body.classList.add('dark');
    } else if (config.theme === 'light') {
      document.body.classList.add('light');
    }

    const metaDescriptionDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
    const metaDescriptionLight = document.querySelector('meta[name="theme-color"][media*="light"]');

    if (config.theme === 'auto') {
      metaDescriptionDark?.setAttribute('content', '#151515');
      metaDescriptionLight?.setAttribute('content', '#fafafa');
    } else {
      const themeColor = getCSSVar('--theme-color');
      metaDescriptionDark?.setAttribute('content', themeColor);
      metaDescriptionLight?.setAttribute('content', themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement('link');
  const proxyFontUrl = '/google-fonts';
  const remoteFontUrl = 'https://fonts.googleapis.com';
  const googleFontUrl = remoteFontUrl; // getClientConfig()?.buildMode === 'export' ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = 'stylesheet';
  linkEl.href =
    googleFontUrl +
    '/css2?family=' +
    encodeURIComponent('Noto Sans:wght@300;400;700;900') +
    '&display=swap';
  document.head.appendChild(linkEl);
};

function Screen() {
  const config = useAppConfig();
  const { chatPath } = useChatPathStore();
  const isAuth = chatPath === Path.Auth;
  const isMobileScreen = useMobileScreen();
  const shouldTightBorder = getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);
  let content;
  if (chatPath === Path.NewChat) {
    content = (
      <React.Suspense fallback={<Loading noLogo />}>
        <NewChat />
      </React.Suspense>
    );
  } else if (chatPath === Path.Masks) {
    content = (
      <React.Suspense fallback={<Loading noLogo />}>
        <MaskPage />
      </React.Suspense>
    );
  } else if (chatPath === Path.Settings) {
    content = (
      <React.Suspense fallback={<Loading noLogo />}>
        <Settings />
      </React.Suspense>
    );
  } else {
    content = (
      <React.Suspense fallback={<Loading noLogo />}>
        <Chat />
      </React.Suspense>
    );
  }

  return (
    <div
      className={
        styles.container +
        ` ${shouldTightBorder ? styles['tight-container'] : styles.container} ${
          getLang() === 'ar' ? styles['rtl-screen'] : ''
        }`
      }
    >
      {isAuth ? (
        <AuthPage />
      ) : (
        // <>
        /*<SideBar />*/
        <div className={styles['window-content']} id={SlotID.AppBody}>
          {content}
        </div>
        // </>
      )}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log('[Config] got config from build time', getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Screen />
    </ErrorBoundary>
  );
}
