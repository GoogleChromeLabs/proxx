/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.
// rollup-plugin-bundle-guard: group=entry

import { Component, ComponentConstructor, VNode } from "preact";

interface Props<T> {
  loading: () => VNode;
  loaded: (componentConstructor: T) => VNode;
}

interface State<T> {
  LoadedComponent?: T;
}

/**
 * Create a lazy-loading component.
 *
 * @param componentPromise A promise for a component class.
 */
export default function deferred<C extends ComponentConstructor<any, any>>(
  componentPromise: Promise<C>
): ComponentConstructor<Props<C>, State<C>> {
  return class Deferred extends Component<Props<C>, State<C>> {
    state: State<C> = {
      LoadedComponent: undefined
    };

    constructor(props: Props<C>) {
      super(props);
      componentPromise.then(component => {
        this.setState({ LoadedComponent: component });
      });
    }

    render({ loaded, loading }: Props<C>, { LoadedComponent }: State<C>) {
      if (LoadedComponent) {
        return loaded(LoadedComponent);
      }

      return loading();
    }
  };
}
