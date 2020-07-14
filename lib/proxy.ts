import {Component} from 'react';
import * as Taro from '@tarojs/taro';

export const excludeKeys = ['state', 'refs', 'props', 'context', 'updater', '_reactInternalFiber', '_reactInternalInstance'];

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
    const proxy = new Proxy(component, new ObjectProxy(() => this.notify()));

    proxyMethod(component, 'componentDidMount', () => {
      readFields(component, key => {
        // 因为把代理逻辑写在了set方法里，所以这里需要把值重新赋值，以触发代理
        proxy[key] = component[key];
      })
    });

    proxyMethod(component, 'componentWillUnmount', () => {
      // 因为形成了循环访问，所以销毁时置空，以免造成内存泄漏
      component.state = null;
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
  constructor(private onSet: OnSet) {
  }

  get(target: any, key: PropertyKey, receiver: any): any {
    return target[key];
  }

  set(target: any, key: PropertyKey, newValue: any, receiver: any): boolean {
    const oldValue = target[key];
    target[key] = boundObjectProxy(newValue, this.onSet);
    this.onSet(key, oldValue, newValue);
    return true;
  }
}

export function boundObjectProxy(value: any, onSet: OnSet, isPage = false) {
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
        if (isPage && excludeKeys.includes(key) || typeof value[key] === 'function') return;

        try {
          value[key] = boundObjectProxy(value[key], onSet);
        } catch (e) {
          // 当属性为 readonly 时，赋值会报错，可以忽略
        }
      });
    }
    value = new Proxy(value, new ObjectProxy(onSet));
  }

  return value;
}

export function readFields<T = any>(instance: T, read: (key: string, instance?: T) => any) {
  Object.keys(instance).forEach(key => {
    if (excludeKeys.includes(key) || typeof instance[key] === 'function') return;
    read(key, instance);
  })
}

export function proxyMethod(instance: any, methodName: string, newMethod: (...args: any[]) => any) {
  const replaced = instance[methodName];
  instance[methodName] = (...args: any[]) => {
    newMethod(...args);
    replaced && replaced(...args);
  };
}
