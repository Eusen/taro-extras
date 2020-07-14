import {Component} from 'react';
import {ProxyFactory} from './proxy';

class BaseComponent<P = any> extends Component<P, any> {
  props: P;
  state: this;

  setState(newState: this, callback: () => void) {
    Object.keys(newState).forEach(key => {
      if (typeof newState[key] !== "function") {
        this.state[key] = key;
      }
    });
    callback && callback();
  }
}


export class StatefulComponent<P = any> extends BaseComponent<P> {
  constructor(props: P) {
    super(props);
    this.state = ProxyFactory.createComponentWatcher(this) as any;
  }
}


export class StatefulPage<P = any> extends BaseComponent<P> {
  constructor(props: P) {
    super(props);
    this.state = ProxyFactory.createPageWatcher(this) as any;
  }
}
