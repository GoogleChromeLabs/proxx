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

import { Component, h } from "preact";

export interface BaseProps<S> {
  hydrate: (el: Element | null) => S;
  id: string;
}

export type HydratableProps<P, S> = P & BaseProps<S>;

export default abstract class HydratableComponent<
  Props extends BaseProps<State>,
  State
> extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const el = document.getElementById(props.id);
    this.state = props.hydrate(el);
  }
}
