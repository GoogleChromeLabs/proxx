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
import { Component, ComponentConstructor, h, VNode } from "preact";

interface LocalProps {
  loading: () => VNode;
}

interface State {
  LoadedComponent: any;
}

// There are many TypeScript sins here.
// I really tried.
// But I failed.
// Forgive me.
/**
 * Create a lazy-loading component. It takes the same props as the target component, along with a
 * 'loading' prop. This prop should be a function that returns vdom for the loading state.
 *
 * @param componentPromise A promise for a component class.
 */
export default function deferred<
  C extends ComponentConstructor<any, any>,
  P = C extends ComponentConstructor<infer P1, any> ? P1 : never,
  S = C extends ComponentConstructor<any, infer S1> ? S1 : never
>(componentPromise: Promise<C>): ComponentConstructor<P & LocalProps, S> {
  return (class Deferred extends Component<P & LocalProps, State> {
    state: State = {
      LoadedComponent: undefined
    };

    constructor(props: P & LocalProps) {
      super(props);
      componentPromise.then(component => {
        this.setState({ LoadedComponent: component });
      });
    }

    render(props: Readonly<P & LocalProps>, { LoadedComponent }: State) {
      const { loading, ...otherProps } = props;
      if (LoadedComponent) {
        return <LoadedComponent {...otherProps} />;
      }

      return loading();
    }
  } as unknown) as ComponentConstructor<P & LocalProps, S>;
}
