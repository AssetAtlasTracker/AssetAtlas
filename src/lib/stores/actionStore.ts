import { writable } from 'svelte/store';

interface ActionMessage {
  text: string;
  id: number;
}

function createActionStore() {
  const { subscribe, update, set } = writable<ActionMessage[]>([]);
  let nextId = 0;

  function addMessage(text: string): Promise<void> {
    console.log('ActionStore: Adding message:', text);
    const id = nextId++;
    
    update(messages => {
      console.log('ActionStore: Current messages:', messages);
      console.log('ActionStore: Adding new message with id:', id);
      return [...messages, { text, id }];
    });

    return new Promise(resolve => {
      setTimeout(() => {
        console.log('ActionStore: Removing message with id:', id);
        update(messages => messages.filter(m => m.id !== id));
        resolve();
      }, 3000);
    });
  }

  function clearMessages() {
    console.log('ActionStore: Clearing all messages');
    set([]);
  }

  return {
    subscribe,
    addMessage,
    clearMessages
  };
}

export const actionStore = createActionStore();
