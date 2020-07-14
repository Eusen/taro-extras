import {Component} from 'react';
import {ProxyFactory} from './proxy';


export class StatefulComponent<P = any> extends Component<P, any> {
  state: this;

  constructor(props: P) {
    super(props);
    this.state = ProxyFactory.createComponentWatcher(this) as any;
  }
}


export class StatefulPage<P = any> extends Component<P, any> {
  state: this;

  constructor(props: P) {
    super(props);
    this.state = ProxyFactory.createPageWatcher(this) as any;
  }
}
