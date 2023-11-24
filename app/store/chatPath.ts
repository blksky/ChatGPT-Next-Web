import { create } from 'zustand';
import { Path } from '../constant';

interface IChatPathStore {
  chatPath: Path;
  chatPathIndex: number;
  chatPathList: Path[];
  navigateChat: (path: Path | number) => void;
}

export const useChatPathStore = create<IChatPathStore>((set, get) => {
  return {
    chatPath: Path.Chat,
    chatPathIndex: 0,
    chatPathList: [Path.Chat],
    navigateChat(path: Path | number) {
      const { chatPathIndex, chatPathList } = get();
      if (Number.isNaN(path)) {
        if (chatPathIndex === chatPathList.length - 1) {
          set(() => ({
            chatPath: path,
            chatPathIndex: chatPathIndex + 1,
            chatPathList: [...chatPathList, path],
          }));
        } else {
          set(() => ({
            chatPath: path,
            chatPathIndex: chatPathIndex + 1,
            chatPathList: [...chatPathList.slice(0, chatPathIndex + 1), path],
          }));
        }
      } else {
        const nextPathIndex = Math.min(Math.max(0, chatPathIndex + path), chatPathList.length - 1);
        set(() => ({
          chatPath: chatPathList[nextPathIndex],
          chatPathIndex: nextPathIndex,
        }));
      }
    },
  };
});
