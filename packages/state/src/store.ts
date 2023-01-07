import { createSignal } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { ApiDefinitionCreator, GenericStoreApi } from './types';
import { create } from './api';

export type StoreValue = {};

export type Store<TState extends StoreValue> = GenericStoreApi<
  TState,
  SetStoreFunction<TState>
> & {
  get: TState;
};

export type StoreDefinitionCreator<
  T extends StoreValue,
  TStoreApi extends GenericStoreApi<T, any>,
  TStoreExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TStoreExtension>;

type MakeStoreConfiguration<TState extends StoreValue> = {
  initialValue: () => TState;
};

function makeStore<TState extends StoreValue, TStoreExtension>(
  options: MakeStoreConfiguration<TState>,
): Store<TState> {
  const [store, internalSetStore] = createStore(options.initialValue());
  const [track, notify] = createSignal([], { equals: false });

  const set: SetStoreFunction<TState> = (...args: unknown[]) => {
    (internalSetStore as any)(...args);
    notify([]);
  };

  const accessor = () => {
    track();
    return store;
  };

  return Object.assign(accessor, {
    set,
    get: store,
  });
}

export const defineStore = create(
  'store',
  <T extends StoreValue>(initialValue: () => T) => {
    return makeStore({ initialValue });
  },
);
