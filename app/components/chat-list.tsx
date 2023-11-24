import { ReactComponent as DeleteIcon } from '../icons/delete.svg';
// import { ReactComponent as BotIcon } from "../icons/bot.svg";

import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from '@hello-pangea/dnd';
import styles from './home.module.scss';

import { useChatPathStore, useChatStore } from '../store';

import { useEffect, useRef } from 'react';
import { Path } from '../constant';
import Locale from '../locales';
import { Mask } from '../store/mask';
import { useMobileScreen } from '../utils';
import { MaskAvatar } from './mask';
import { showConfirm } from './ui-lib';

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: 'center',
      });
    }
  }, [props.selected]);
  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={`${styles['chat-item']} ${props.selected && styles['chat-item-selected']}`}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
        >
          {props.narrow ? (
            <div className={styles['chat-item-narrow']}>
              <div className={styles['chat-item-avatar'] + ' no-dark'}>
                <MaskAvatar avatar={props.mask.avatar} model={props.mask.modelConfig.model} />
              </div>
              <div className={styles['chat-item-narrow-count']}>{props.count}</div>
            </div>
          ) : (
            <>
              <div className={styles['chat-item-title']}>{props.title}</div>
              <div className={styles['chat-item-info']}>
                <div className={styles['chat-item-count']}>
                  {Locale.ChatItem.ChatItemCount(props.count)}
                </div>
                <div className={styles['chat-item-date']}>{props.time}</div>
              </div>
            </>
          )}

          <div
            className={styles['chat-item-delete']}
            onClickCapture={(e) => {
              props.onDelete?.();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DeleteIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const { navigateChat } = useChatPathStore();
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore((state) => [
    state.sessions,
    state.currentSessionIndex,
    state.selectSession,
    state.moveSession,
  ]);
  const chatStore = useChatStore();
  const isMobileScreen = useMobileScreen();

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chat-list">
        {(provided) => (
          <div className={styles['chat-list']} ref={provided.innerRef} {...provided.droppableProps}>
            {sessions.map((item, i) => (
              <ChatItem
                title={item.topic}
                time={new Date(item.lastUpdate).toLocaleString()}
                count={item.messages.length}
                key={item.id}
                id={item.id}
                index={i}
                selected={i === selectedIndex}
                onClick={() => {
                  navigateChat(Path.Chat);
                  selectSession(i);
                }}
                onDelete={async () => {
                  if (
                    (!props.narrow && !isMobileScreen) ||
                    (await showConfirm(Locale.Home.DeleteChat))
                  ) {
                    chatStore.deleteSession(i);
                  }
                }}
                narrow={props.narrow}
                mask={item.mask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
