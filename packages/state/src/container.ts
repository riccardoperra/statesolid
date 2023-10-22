import { getOwner, type Owner, runWithOwner } from 'solid-js';
import { ExtractStore, GenericStoreApi, StoreApiDefinition } from './types';
import { $CREATOR, resolve } from './api';

export class Container {
  private readonly states = new Map<string, GenericStoreApi>();

  protected constructor(private readonly owner: Owner) {}

  static create(owner?: Owner) {
    const resolvedOwner = owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statebuilder] Using StateContainer without <StateProvider/> or `createRoot()` context is discouraged',
      );
    }
    return new Container(resolvedOwner);
  }

  get<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): ExtractStore<TStoreDefinition> {
    type TypedStore = ExtractStore<TStoreDefinition>;

    try {
      const name = state[$CREATOR].name;
      const instance = this.states.get(name);
      if (instance) {
        return instance as unknown as TypedStore;
      }
      const store = this.#resolveStore(this.owner, state);
      this.states.set(name, store!);
      return store as TypedStore;
    } catch (exception) {
      if (exception instanceof Error) throw exception;
      throw new Error(
        '[statebuilder] An error occurred during store initialization',
        { cause: exception },
      );
    }
  }

  #resolveStore<TStoreDefinition extends StoreApiDefinition<any, any>>(
    owner: Owner,
    state: TStoreDefinition,
  ) {
    let error: Error | undefined;
    const resolvedOwner = this.#resolveOwner(state, owner);
    const store = runWithOwner(resolvedOwner, () => {
      try {
        return resolve(state, this);
      } catch (e) {
        error = e as Error;
      }
    });
    if (error) throw error;
    return store;
  }

  #resolveOwner<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
    fallbackOwner: Owner,
  ) {
    const metadata = state[$CREATOR];
    return metadata.owner ?? fallbackOwner;
  }
}
