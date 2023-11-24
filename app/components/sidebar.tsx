import React, { useEffect, useMemo, useRef } from 'react';
import { ReactComponent as AddIcon } from '../icons/add.svg';
import { ReactComponent as ChatGptIcon } from '../icons/chatgpt.svg';
import { ReactComponent as DeleteIcon } from '../icons/delete.svg';
import { ReactComponent as DragIcon } from '../icons/drag.svg';
import { ReactComponent as GithubIcon } from '../icons/github.svg';
import { ReactComponent as MaskIcon } from '../icons/mask.svg';
import { ReactComponent as PluginIcon } from '../icons/plugin.svg';
import { ReactComponent as SettingsIcon } from '../icons/settings.svg';
import { IconButton } from './button';
import styles from './home.module.scss';

import Locale from '../locales';

import { useAppConfig, useChatPathStore, useChatStore } from '../store';

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from '../constant';

import { isIOS, useMobileScreen } from '../utils';
import { showConfirm, showToast } from './ui-lib';

// const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
//   loading: () => null,
// });

// @ts-ignore
const ChatList: any = React.lazy(() =>
  import('./chat-list').then((res) => ({ default: res.ChatList })),
);

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === 'ArrowUp') {
          chatStore.nextSession(-1);
        } else if (e.key === 'ArrowDown') {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow = !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = 0; // isMobileScreen ? '100vw' : `${barWidth}px`;
    document.documentElement.style.setProperty('--sidebar-width', sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const config = useAppConfig();
  const { navigateChat } = useChatPathStore();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(() => isIOS() && isMobileScreen, [isMobileScreen]);

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${shouldNarrow && styles['narrow-sidebar']}`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? 'none' : undefined,
      }}
    >
      <div className={styles['sidebar-header']} data-tauri-drag-region>
        <div className={styles['sidebar-title']} data-tauri-drag-region>
          ChatGPT Next
        </div>
        <div className={styles['sidebar-sub-title']}>Build your own AI assistant.</div>
        <div className={styles['sidebar-logo'] + ' no-dark'}>
          <ChatGptIcon />
        </div>
      </div>

      <div className={styles['sidebar-header-bar']}>
        <IconButton
          icon={<MaskIcon />}
          text={shouldNarrow ? undefined : Locale.Mask.Name}
          className={styles['sidebar-bar-button']}
          onClick={() => {
            if (config.dontShowMaskSplashScreen !== true) {
              navigateChat(Path.NewChat, { state: { fromHome: true } });
            } else {
              navigateChat(Path.Masks, { state: { fromHome: true } });
            }
          }}
          shadow
        />
        <IconButton
          icon={<PluginIcon />}
          text={shouldNarrow ? undefined : Locale.Plugin.Name}
          className={styles['sidebar-bar-button']}
          onClick={() => showToast(Locale.WIP)}
          shadow
        />
      </div>

      <div
        className={styles['sidebar-body']}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigateChat(Path.Home);
          }
        }}
      >
        <React.Suspense>
          <ChatList narrow={shouldNarrow} />
        </React.Suspense>
      </div>

      <div className={styles['sidebar-tail']}>
        <div className={styles['sidebar-actions']}>
          <div className={styles['sidebar-action'] + ' ' + styles.mobile}>
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div>
          <div className={styles['sidebar-action']}>
            <a onClick={() => navigateChat(Path.Settings)}>
              <IconButton icon={<SettingsIcon />} shadow />
            </a>
          </div>
          <div className={styles['sidebar-action']}>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              <IconButton icon={<GithubIcon />} shadow />
            </a>
          </div>
        </div>
        <div>
          <IconButton
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigateChat(Path.Chat);
              } else {
                navigateChat(Path.NewChat);
              }
            }}
            shadow
          />
        </div>
      </div>

      <div className={styles['sidebar-drag']} onPointerDown={(e) => onDragStart(e as any)}>
        <DragIcon />
      </div>
    </div>
  );
}
