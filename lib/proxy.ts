import {Component} from 'react';
import * as Taro from '@tarojs/taro';

const excludeKeys = ['state', 'refs', 'props', 'context', 'updater', '_reactInternalFiber', '_reactInternalInstance'];

export class ProxyFactory {
  private static pagesMap: { [key: string]: Component } = {};

  private static setPage(page: any) {
    this.pagesMap[page.props.tid] = page;
  }

  static notify() {
    const pages = Taro.getCurrentPages();
    const lastPage = pages[pages.length - 1];
    this.pagesMap[lastPage.route].forceUpdate();
  }

  static createComponentWatcher(component: any) {
    // 监听所有属性，除了 state props
    const proxy = new Proxy(
        component,
        new ObjectProxy(() => this.notify())
    );

    proxyMethod(component, 'componentDidMount', () => {
      Object.keys(component).forEach(key => {
        if (!excludeKeys.includes(key) && typeof component[key] !== 'function') {
          // 因为把迭代代理的逻辑写在了set方法里，所以这里需要把值重新赋值，已触发代理
          proxy[key] = component[key];
        }
      });
    });

    proxyMethod(component, 'componentWillUnmount', () => {
      proxy.destroy();
    });

    return proxy;
  }

  static createPageWatcher(page: any) {
    this.setPage(page);
    return this.createComponentWatcher(page);
  }
}

export type OnSet = (key?: PropertyKey, oldValue?: any, newValue?: any) => void;

export class ObjectProxy implements ProxyHandler<any> {
  private isUnmount = false;

  constructor(private onSet: OnSet) {
  }

  // @ts-ignore
  get(target: any, key: PropertyKey, receiver: any): any {
    return target[key];
  }

  // @ts-ignore
  set(target: any, key: PropertyKey, newValue: any, receiver: any): boolean {
    const oldValue = target[key];
    target[key] = boundObjectProxy(newValue, this.onSet);
    !this.isUnmount && this.onSet(key, oldValue, newValue);
    return true;
  }

  destroy() {
    this.isUnmount = true;
  }
}

export function boundObjectProxy(value: any, onSet: OnSet) {
  if (!value) {
    return value;
  }

  if (typeof value === 'object') {
    if (value instanceof Array) {
      value = value.map(item => {
        return boundObjectProxy(item, onSet);
      });
    } else {
      Object.keys(value).forEach(key => {
        value[key] = boundObjectProxy(value[key], onSet);
      });
    }
    value = new Proxy(value, new ObjectProxy(onSet));
  }

  return value;
}

export function proxyMethod(instance: any, methodName: string, newMethod: (...args: any[]) => any) {
  const replaced = instance[methodName];
  instance[methodName] = (...args: any[]) => {
    newMethod(...args);
    replaced && replaced(...args);
  };
}
