import styles from './auth.module.scss';
import { IconButton } from './button';

import { Path } from '../constant';
import Locale from '../locales';
import { useAccessStore, useChatPathStore } from '../store';

import { useEffect } from 'react';
import { getClientConfig } from '../config/client';
import BotIcon from '../icons/bot.svg';

export function AuthPage() {
  const accessStore = useAccessStore();
  const { chatPath, navigateChat } = useChatPathStore();

  const goHome = () => navigateChat(Path.Home);
  const goChat = () => navigateChat(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = '';
      access.accessCode = '';
    });
  }; // Reset access code to empty string

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigateChat(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles['auth-page']}>
      <div className={`no-dark ${styles['auth-logo']}`}>
        <BotIcon />
      </div>

      <div className={styles['auth-title']}>{Locale.Auth.Title}</div>
      <div className={styles['auth-tips']}>{Locale.Auth.Tips}</div>

      <input
        className={styles['auth-input']}
        type="password"
        placeholder={Locale.Auth.Input}
        value={accessStore.accessCode}
        onChange={(e) => {
          accessStore.update((access) => (access.accessCode = e.currentTarget.value));
        }}
      />
      {!accessStore.hideUserApiKey ? (
        <>
          <div className={styles['auth-tips']}>{Locale.Auth.SubTips}</div>
          <input
            className={styles['auth-input']}
            type="password"
            placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
            value={accessStore.openaiApiKey}
            onChange={(e) => {
              accessStore.update((access) => (access.openaiApiKey = e.currentTarget.value));
            }}
          />
        </>
      ) : null}

      <div className={styles['auth-actions']}>
        <IconButton text={Locale.Auth.Confirm} type="primary" onClick={goChat} />
        <IconButton
          text={Locale.Auth.Later}
          onClick={() => {
            resetAccessCode();
            goHome();
          }}
        />
      </div>
    </div>
  );
}
